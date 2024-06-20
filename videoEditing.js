import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, msToTime } from './utilities.js';

export async function editVideo(
	inputVideo,
	subtitleFile,
	audioFile,
	outputVideo
) {
	const videoDuration = (await getAudioDuration(audioFile)) * 1000;
	const videoStart = Math.floor(
		Math.random() * (13 * 60 * 1000 - videoDuration)
	);

	ffmpeg()
		.input(inputVideo)
		.setStartTime(msToTime(videoStart))
		.setDuration(videoDuration / 1000)
		.videoFilter([`ass=${subtitleFile}`, 'crop=ih*9/16:ih'])
		.on('end', () => {
			// Step 2: Add the audio to the edited video
			ffmpeg()
				.input('./output/tmp.mp4') // Use the output from step 1
				.input(audioFile)
				.audioCodec('copy')
				.outputOptions(['-map 0:v:0', '-map 1:a:0', '-shortest'])
				.on('end', () => {})
				.on('error', (err) => {
					console.error('Error:', err);
				})
				.save(outputVideo);
		})
		.on('error', (err) => {
			console.error('Error:', err);
		})
		.save('./output/tmp.mp4'); // Temporary file for edited video
}
