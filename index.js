import { GoogleGenerativeAI } from '@google/generative-ai';
import { ElevenLabsClient, play } from 'elevenlabs';
import { AssemblyAI } from 'assemblyai';

import { configDotenv } from 'dotenv';
import fs from 'fs';
import fsPromise from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';

const project_id =
	Math.random().toString(36).substring(2, 15) +
	Math.random().toString(36).substring(2, 15);

await fsPromise.mkdir(`./output_${project_id}`)

configDotenv();

const elevenlabs_key = process.env.elevenlabs;
const gemini_key = process.env.gemini;
const assemblyAI_key = process.env.assemblyAI;

console.log({ project_id, elevenlabs_key, gemini_key, assemblyAI_key });
const genAI = new GoogleGenerativeAI(gemini_key);
const gemini_client = genAI.getGenerativeModel({
	model: 'gemini-1.5-pro-latest',
});
const elevenlabs_client = new ElevenLabsClient({
	apiKey: elevenlabs_key,
});

const geminiResult = await gemini_client.generateContent(
	'write a very short realistic revenge story that could actually happen in the first person. do not pass a couple sentences in length'
);
const text = geminiResult.response.text();

console.log('Text generated successfully');

await fsPromise.writeFile(`./output_${project_id}/text.txt`, text);
console.log('Text saves successfully');

const audio = await elevenlabs_client.generate({
	voice: 'Daniel',
	text: text,
	model_id: 'eleven_multilingual_v2',
});
console.log('Audio generated successfully');

const fileStream = fs.createWriteStream(`./output_${project_id}/audio.mp3`);
await new Promise((resolve) => audio.pipe(fileStream).on('finish', resolve));
console.log('Audio saved successfully');

const assemblyAI_client = new AssemblyAI({ apiKey: assemblyAI_key });
const transcript = await assemblyAI_client.transcripts.transcribe({
	audio: `./output_${project_id}/audio.mp3`,
});
console.log('Transcript generated successfully');

await fsPromise.writeFile(
	`./output_${project_id}/transcript.json`,
	JSON.stringify(transcript.words)
);
console.log('Transcript saved successfully');

function msToTime(duration) {
	let milliseconds = parseInt((duration % 1000) / 10),
		seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;
	milliseconds = milliseconds < 10 ? '0' + milliseconds : milliseconds;

	return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

const header = `
	[Script Info]
	Title: Subtitles
	ScriptType: v4.00+

	[V4+ Styles]
	Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
	Style: Default,Arial,36,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

	[Events]
	Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

const events = transcript.words
	.map((sub) => {
		const startTime = msToTime(sub.start);
		const endTime = msToTime(sub.end);
		const text = sub.text.replace(/(\r\n|\n|\r)/gm, ' ');
		const fadeEffect = `{\fad(300,300)}`; // Fade in/out animation

		return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${fadeEffect}${text}`;
	})
	.join('\n');

const subtitles = header + events;
console.log('subtitles generated successfully');

await fsPromise.writeFile(`./output_${project_id}/subtitles.ass`, subtitles, 'utf-8');
console.log('subtitles saved successfully');

const videoLength = transcript.words[transcript.words.length - 1].end + 5000;

const inputVideo = './backgrounds/minecraft.mp4';
const subtitle_file = `./output_${project_id}/subtitles.ass`;
const outputVideo = `./output_${project_id}/video.mp4`;
const audioFile = `./output_${project_id}/audio.mp3`; // Define the path to your audio file

ffmpeg()
	.input(inputVideo)
	.input(audioFile) // Add the audio file as an input
	.inputOptions(`-to ${msToTime(videoLength)}`)
	.videoFilter([
		`ass=${subtitle_file}`,
		'crop=ih*9/16:ih', // Crop the video to a 9:16 aspect ratio based on the height
	])
	.audioCodec('copy') // Use the same audio codec for the output
	.outputOptions([
		'-map 0:v:0', // Map the video stream from the first input (video file)
		'-map 1:a:0', // Map the audio stream from the second input (audio file)
		'-shortest', // Finish encoding when the shortest input stream ends
	])
	.on('end', () => {
		console.log('video assembled successfully');
	})
	.on('error', (err) => {
		console.error('Error:', err);
	})
	.save(outputVideo);
