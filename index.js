import { generateScript } from './textGeneration.js';
import { synthesizeSpeech } from './speechSynthesis.js';
import { transcribeAudio, generateSubtitles } from './transcription.js';
import { editVideo } from './videoEditing.js';
import fs from 'fs/promises';
import { config } from 'dotenv';
config();

async function main() {
	const script = await generateScript(
		`write a realistic and catchy story that could actually happen. write it in the first person perspective and in three or four lines. use everyday language, nothing too fancy`
	);
	await fs.writeFile('./output/tmp.txt', script);
	const audio = await synthesizeSpeech(script);
	await fs.writeFile('./output/tmp.mp3', audio);
	const transcript = await transcribeAudio('./output/tmp.mp3');
	const subtitles = generateSubtitles(transcript);
	await fs.writeFile('./output/tmp.ass', subtitles);
	await editVideo(
		'./backgrounds/minecraft.mp4',
		'./output/tmp.ass',
		'./output/tmp.mp3',
		`./output/video.mp4`
	);
}

main().catch(console.error);
