import ffmpeg from 'fluent-ffmpeg';
import { getClipDuration, msToTime } from './utilities.js';
import process from 'process';
import path from 'path';

export async function editVideo(
	backgroundFilePath,
	subtitleFilePath,
	audioFilePath,
	outputFilePath
) {
	const videoDuration = (await getClipDuration(audioFilePath)) * 1000;
	const videoStart = Math.floor(
		Math.random() *
			((await getClipDuration(backgroundFilePath)) * 1000 - videoDuration)
	);

	return new Promise((res) => {
		ffmpeg()
			.input(backgroundFilePath)
			.setStartTime(msToTime(videoStart))
			.setDuration(videoDuration / 1000)
			.videoFilter([`ass=${subtitleFilePath}`, 'crop=ih*9/16:ih'])
			.videoCodec('libx264')
			.audioCodec('aac')
			.audioBitrate('192k')
			.videoBitrate('3000k')
			.addOptions(['-crf 20'])
			.on('end', () => {
				// Step 2: Add the audio to the edited video
				ffmpeg()
					.input(path.join(process.cwd(), '/tmp/tmp.mp4')) // Use the output from step 1
					.input(audioFilePath)
					.audioCodec('copy') // No need to re-encode audio here
					.outputOptions(['-map 0:v:0', '-map 1:a:0', '-shortest'])
					.on('end', () => {
						res();
					})
					.on('error', (err) => {
						6;
						console.error('Error:', err);
					})
					.save(outputFilePath);
			})
			.on('error', (err) => {
				console.error('Error:', err);
			})
			.save(path.join(process.cwd(), '/tmp/tmp.mp4'));
	});
}
