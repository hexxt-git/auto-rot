import { generateScript } from './textGeneration.js';
import { synthesizeSpeech } from './speechSynthesis.js';
import { transcribeAudio, generateSubtitles } from './transcription.js';
import { editVideo } from './videoEditing.js';
import fs from 'fs/promises';
import { msToTime, randomBackground } from './utilities.js';
import process from 'process';
import path from 'path';
import { config } from 'dotenv';
config();

async function main() {
	const start = new Date();
	const script = await generateScript(
		`write a realistic and catchy story that could actually happen. write it in the first person perspective and in three or four lines. use everyday language, nothing too fancy. this story must be somewhat interesting and fishy from the start`,
		`these real life stories are a combination of fan suggestion and my own creation. comment down below interesting stories you want to share <break time="400ms" /> and follow for more posts like these. `
	);
	await fs.writeFile(path.join(process.cwd(), '/tmp/script.txt'), script);

	const audio = await synthesizeSpeech(script);
	await fs.writeFile(path.join(process.cwd(), '/tmp/audio.mp3'), audio);

	const transcript = await transcribeAudio(
		path.join(process.cwd(), '/tmp/audio.mp3')
	);
	const subtitles = generateSubtitles(transcript);
	await fs.writeFile(path.join(process.cwd(), '/tmp/transcript.ass'), subtitles);

	const backgroundClip = randomBackground();
	await editVideo(
		backgroundClip,
		path.join(process.cwd(), '/tmp/transcript.ass'),
		path.join(process.cwd(), '/tmp/audio.mp3'),
		`./output/video-${Math.floor(Math.random() * 1e9)}.mp4`
	);

	const end = new Date();
	const time = msToTime(end - start);
	console.log({ time });
}

main().catch(console.error);
