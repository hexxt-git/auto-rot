import textToSpeech from '@google-cloud/text-to-speech';

export async function synthesizeSpeech(text) {
	const client = new textToSpeech.TextToSpeechClient();
	const [response] = await client.synthesizeSpeech({
		input: { text },
		voice: { languageCode: 'en-US', ssmlGender: 'MALE' },
		audioConfig: { audioEncoding: 'MP3' },
	});
	return response.audioContent;
}
