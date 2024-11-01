import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateScript(topic, outro, channel_description) {
	const genAI = new GoogleGenerativeAI(process.env.gemini);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
		systemInstruction: `
			you're a content creator for short form videos. the videos you make are typically from five to ten minutes long and are engaging and catchy from the beginning so they must have a hook. when prompted with a topic write a script in text format with no extra punctuation or separation.
			generate the whole script not just an intro. the description for you channel is as follows: ${JSON.stringify(channel_description)}
		`,
	});
	const geminiResult = await gemini_client.generateContent(topic ?? 'random topic');
	const text = geminiResult.response.text();

	return `
		<speak>
			${text ?? 'there was an error generating the script'}...
			<break time="3000ms" />
			${outro ?? ''}
			<break time="3s" />
		</speak>
	`;
}
