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

async function execute(fn, action_name, update) {
	// console.log(`attempting "${action_name}"`);
	update('pending', action_name);

	let attempts = 5;
	let start = new Date();
	let output = null;
	let error;

	while (attempts > 0) {
		try {
			output = await fn();
			break;
		} catch (err) {
			attempts -= 1;
			error = err;
			// console.error(err);
			await new Promise((res) => setTimeout(res, 500));
		}
	}

	let end = new Date();
	let time = msToTime(end - start);

	if (attempts <= 0) {
		update('failed', JSON.stringify({ action: action_name }));
		throw error;
	}

	return output;
}

export async function generateShort(id, topic, outro, channel_description, update) {
	const task_id = id ?? Math.floor(Math.random() * 1e12);
	const start = new Date();
	console.log(`starting new task: `, task_id);

	await execute(
		async () => {
			const script = await generateScript(topic, outro, channel_description);
			await fs.writeFile(path.join(process.cwd(), `/tmp/script_${task_id}.txt`), script);
		},
		'generating script',
		update
	);

	await execute(
		async () => {
			const audio = await synthesizeSpeech(path.join(process.cwd(), `/tmp/script_${task_id}.txt`));
			await fs.writeFile(path.join(process.cwd(), `/tmp/audio_${task_id}.mp3`), audio);
		},
		'generating audio',
		update
	);

	await execute(
		async () => {
			const transcript = await transcribeAudio(path.join(process.cwd(), `/tmp/audio_${task_id}.mp3`));
			await fs.writeFile(path.join(process.cwd(), `/tmp/transcript_${task_id}.txt`), JSON.stringify(transcript));
		},
		'generating transcript',
		update
	);

	await execute(
		async () => {
			const subtitles = generateSubtitles(path.join(process.cwd(), `/tmp/transcript_${task_id}.txt`));
			await fs.writeFile(path.join(process.cwd(), `/tmp/subtitles_${task_id}.ass`), subtitles);
		},
		'generating subtitles',
		update
	);

	await execute(
		async () => {
			const backgroundClip = randomBackground();
			await editVideo(
				backgroundClip,
				path.join(process.cwd(), `/tmp/subtitles_${task_id}.ass`),
				path.join(process.cwd(), `/tmp/audio_${task_id}.mp3`),
				path.join(process.cwd(), `/tmp/video_${task_id}.mp4`),
				path.join(process.cwd(), `/output/video_${task_id}.mp4`)
			);
		},
		'editing video',
		update
	);

	const end = new Date();
	const time = msToTime(end - start);
	console.log('task completed', id, `time taken: ${time}`);

	update('done', `done in: ${time}`);
	return task_id;
}
