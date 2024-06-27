import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateScript(prompt, outro) {
	const genAI = new GoogleGenerativeAI(process.env.gemini);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
		systemInstruction: `
			you are a story telling and gathering person. your passion is in telling real stories that happened to you or people you know.
			the stories can be a few lines long and must have a hook and a satisfying ending.
		`
	});
	const geminiResult = await gemini_client.generateContent(prompt);
	const text = geminiResult.response.text();

	return `
		<speak>
			${text}...
			<break time="3000ms" />
			${outro}
			<break time="3s" />
		</speak>
	`;
}
