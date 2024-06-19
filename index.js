import { GoogleGenerativeAI } from '@google/generative-ai';
import textToSpeech from '@google-cloud/text-to-speech';
import { AssemblyAI } from 'assemblyai';

import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';

import { config } from 'dotenv';
config();

async function generateVideo() {
	const project_id =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);

	await fs.mkdir(`./outputs/output_${project_id}`);

	const gemini_key = process.env.gemini;
	const assemblyAI_key = process.env.assemblyAI;

	console.log({ project_id, gemini_key, assemblyAI_key });
	const genAI = new GoogleGenerativeAI(gemini_key);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
	});

	const geminiResult = await gemini_client.generateContent(
		'write a very short realistic story that could actually happen in the first person. in two or three sentences'
	);
	const text = geminiResult.response.text();

	console.log('Text generated successfully');

	await fs.writeFile(`./outputs/output_${project_id}/text.txt`, text);
	console.log('Text saves successfully');

	const google_tts_client = new textToSpeech.TextToSpeechClient();
	const [tts_response] = await google_tts_client.synthesizeSpeech({
		input: { text },
		voice: { languageCode: 'en-US', ssmlGender: 'MALE' },
		audioConfig: { audioEncoding: 'MP3' },
	});
	const audio = tts_response.audioContent;
	console.log('Audio generated successfully');

	await fs.writeFile(
		`./outputs/output_${project_id}/audio.mp3`,
		audio,
		'binary'
	);
	console.log('Audio saved successfully');

	const assemblyAI_client = new AssemblyAI({ apiKey: assemblyAI_key });
	const transcript = await assemblyAI_client.transcripts.transcribe({
		audio: `./outputs/output_${project_id}/audio.mp3`,
	});
	console.log('Transcript generated successfully');

	await fs.writeFile(
		`./outputs/output_${project_id}/transcript.json`,
		JSON.stringify(transcript.words)
	);
	console.log('Transcript saved successfully');

	function msToTime(duration) {
		duration = duration / 1;
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
    Style: Default,Comic Neue,32,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,0,2,10,10,30,1

    [Events]
    Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
	const events = transcript.words
		.map((sub) => {
			const startTime = msToTime(sub.start);
			const endTime = msToTime(sub.end);
			const text = sub.text.replace(/(\r\n|\n|\r)/gm, ' ');
			const fadeEffect = `{\fad(300,300)}`; // Fade in/out animation

			return `Dialogue: 0,${startTime},${endTime}Y,Default,,0,0,0,,${fadeEffect}${text}`;
		})
		.join('\n');

	const subtitles = header + events;
	console.log('subtitles generated successfully');

	await fs.writeFile(
		`./outputs/output_${project_id}/subtitles.ass`,
		subtitles,
		'utf-8'
	);
	console.log('subtitles saved successfully');

	const videoLength =
		transcript.words[transcript.words.length - 1].end + 5000;
	const videoStart = Math.floor(
		Math.random() * (13 * 60 * 1000 - videoLength)
	);

	const inputVideo = './backgrounds/minecraft.mp4';
	const subtitle_file = `./outputs/output_${project_id}/subtitles.ass`;
	const outputVideo = `./outputs/output_${project_id}/video_${project_id}.mp4`;
	const audioFile = `./outputs/output_${project_id}/audio.mp3`;

	// Step 1: Edit the video
	await ffmpeg()
		.input(inputVideo)
		.setStartTime(msToTime(videoStart))
		.setDuration(videoLength / 1000)
		.videoFilter([`ass=${subtitle_file}`, 'crop=ih*9/16:ih'])
		.on('end', () => {
			console.log('video edited successfully');

			// Step 2: Add the audio to the edited video
			ffmpeg()
				.input('tmp.mp4') // Use the output from step 1
				.input(audioFile)
				.audioCodec('copy')
				.outputOptions(['-map 0:v:0', '-map 1:a:0', '-shortest'])
				.on('end', () => {
					console.log('video assembled successfully');
				})
				.on('error', (err) => {
					console.error('Error:', err);
				})
				.save(outputVideo);
		})
		.on('error', (err) => {
			console.error('Error:', err);
		})
		.save('tmp.mp4'); // Temporary file for edited video

	return project_id;
}

while(true){
	try{
		await generateVideo();
	} catch (err) {
		console.error(err);
		await new Promise((resolve) => setTimeout(resolve, 10000));
	}
}
