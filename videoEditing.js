import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, msToTime } from './utilities.js';

export async function editVideo(
    inputVideo,
    subtitleFile,
    audioFile,
    outputVideo
) {
    // Calculate the video length based on the audio file duration
    const videoLength = await getAudioDuration(audioFile); // Assuming this returns duration in milliseconds

    // Calculate a random start time for the video snippet
    const videoStart = Math.floor(
        Math.random() * (13 * 60 * 1000 - videoLength)
    );

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(inputVideo)
            .inputOptions([`-ss ${msToTime(videoStart)}`]) // Set the start time for the video input
            .input(audioFile)
            .outputOptions([
                `-t ${videoLength / 1000}`, // Set the duration of the output to match the audio length
                '-map 0:v:0', // Use the video stream from the first input
                '-map 1:a:0', // Use the audio stream from the second input
                '-c:v copy', // Copy the video codec
                '-c:a copy', // Copy the audio codec
                `-vf ass=${subtitleFile},crop=ih*9/16:ih` // Apply subtitle and crop filters to the video stream
            ])
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                console.error('Error:', err);
                reject(err);
            })
            .save(outputVideo); // Save the output video
    });
}