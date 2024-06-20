import { generateScript } from './textGeneration.js';
import { synthesizeSpeech } from './speechSynthesis.js';
import { transcribeAudio, generateSubtitles } from './transcription.js';
import { editVideo } from './videoEditing.js';
import fs from 'fs/promises';
import { config } from 'dotenv';
import { msToTime } from './utilities.js';
config();

async function main() {
	const start = new Date();
	const script = await generateScript(
		`write a realistic and catchy story that could actually happen. write it in the first person perspective and in three or four lines. use everyday language, nothing too fancy. this story must be somewhat interesting and fishy from the start`
	);
	await fs.writeFile('./tmp/script.txt', script);

	const audio = await synthesizeSpeech(script);
	await fs.writeFile('./tmp/audio.mp3', audio);

	const transcript = await transcribeAudio('./tmp/audio.mp3');
	const subtitles = generateSubtitles(transcript);
	await fs.writeFile('./tmp/transcript.ass', subtitles);

	await editVideo(
		'./backgrounds/minecraft.mp4',
		'./tmp/transcript.ass',
		'./tmp/audio.mp3',
		`./output/video-${Math.floor(Math.random() * 1e9)}.mp4`
	);

	const end = new Date();
	const time = msToTime(end - start);
	console.log({ time });

	await main()
}

main().catch(console.error);
