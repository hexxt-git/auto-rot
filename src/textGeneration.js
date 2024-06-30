import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateScript(topic, outro) {
	const genAI = new GoogleGenerativeAI(process.env.gemini);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
		systemInstruction: `
			you're a content creator for short form videos. the videos you make are typically from two to five minutes long and are engaging and catchy from the beginning so they must have a hook. when prompted with a topic write a script in text format with no extra punctuation or separation.
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
