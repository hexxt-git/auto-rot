import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';

export async function synthesizeSpeech(pathToScript) {
	const script = await fs.readFile(pathToScript);
	
	const client = new textToSpeech.TextToSpeechClient();
	const [response] = await client.synthesizeSpeech({
		input: { ssml: script },
		voice: { languageCode: 'en-US', ssmlGender: 'MALE' },
		audioConfig: { audioEncoding: 'MP3' },
	});
	return response.audioContent;
}
