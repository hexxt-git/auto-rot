import textToSpeech from '@google-cloud/text-to-speech';

export async function synthesizeSpeech(script) {
	const client = new textToSpeech.TextToSpeechClient();
	const [response] = await client.synthesizeSpeech({
		input: { ssml: script },
		voice: { languageCode: 'en-US', ssmlGender: 'MALE' },
		audioConfig: { audioEncoding: 'MP3' },
	});
	return response.audioContent;
}
