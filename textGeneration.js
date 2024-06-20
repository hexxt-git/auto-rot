import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateScript(prompt) {
	const genAI = new GoogleGenerativeAI(process.env.gemini);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
		systemInstruction: `
			you are a story telling and gathering person. your passion is in telling real stories that happened to you or people you know.
			the stories you tell must be just three to four lines and must have a satisfying ending.
		`
	});
	const geminiResult = await gemini_client.generateContent(prompt);
	const text = geminiResult.response.text();

	return `
		<speak>
			${text}...
			<break time="1500ms" />
			these real life stories are a combination of fan suggestion and my own creation. comment down bellow what stories you have and follow for more posts like these.
		</speak>
	`;
}
