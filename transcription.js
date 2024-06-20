import { AssemblyAI } from 'assemblyai';

export async function transcribeAudio(audioPath) {
	await new Promise(res => setTimeout(res, 3000))
	const client = new AssemblyAI({ apiKey: process.env.assemblyAI });
	const transcript = await client.transcripts.transcribe({
		audio: audioPath,
	});
	return transcript.words;
}

import { msToTime } from './utilities.js';

export function generateSubtitles(transcript) {
	const header = `
    [Script Info]
    Title: Subtitles
    ScriptType: v4.00+

    [V4+ Styles]
    Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
    Style: Default,Comic Neue,32,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,6,0,2,10,10,90,1

    [Events]
    Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
	const events = transcript
		.map((sub) => {
			const startTime = msToTime(sub.start);
			const endTime = msToTime(sub.end);
			const text = sub.text.replace(/(\r\n|\n|\r)/gm, ' ');
			const fadeEffect = `{\fad(300,300)}`;
			return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${fadeEffect}${text}`;
		})
		.join('\n');

	const subtitles = header + events;
	return subtitles;
}
