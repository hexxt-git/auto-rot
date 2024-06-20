import ffmpeg from 'fluent-ffmpeg';

export function msToTime(duration) {
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

export function getAudioDuration(filePath) {
	return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
        });
    });
}
