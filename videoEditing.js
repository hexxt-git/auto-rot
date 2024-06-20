import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, msToTime } from './utilities.js';

export async function editVideo(
	inputVideo,
	subtitleFile,
	audioFile,
	outputVideo
) {
	await new Promise((res) => setTimeout(res, 2000));

	const videoDuration = (await getAudioDuration(audioFile)) * 1000;
	const videoStart = Math.floor(
		Math.random() * (13 * 60 * 1000 - videoDuration)
	);

	return new Promise((res) => {
		ffmpeg()
			.input(inputVideo)
			.setStartTime(msToTime(videoStart))
			.setDuration(videoDuration / 1000)
			.videoFilter([`ass=${subtitleFile}`, 'crop=ih*9/16:ih'])
			.videoCodec('libx264')
			.audioCodec('aac')
			.audioBitrate('192k')
			.videoBitrate('5000k')
			.addOptions(['-crf 20'])
			.on('end', () => {
				// Step 2: Add the audio to the edited video
				ffmpeg()
					.input('./tmp/tmp.mp4') // Use the output from step 1
					.input(audioFile)
					.audioCodec('copy') // No need to re-encode audio here
					.outputOptions(['-map 0:v:0', '-map 1:a:0', '-shortest'])
					.on('end', () => res)
					.on('error', (err) => {
						console.error('Error:', err);
					})
					.save(outputVideo);
			})
			.on('error', (err) => {
				console.error('Error:', err);
			})
			.save('./tmp/tmp.mp4');
	});
}
