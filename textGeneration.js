import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateText(prompt) {
	const genAI = new GoogleGenerativeAI(process.env.gemini);
	const gemini_client = genAI.getGenerativeModel({
		model: 'gemini-1.5-pro-latest',
	});
	const geminiResult = await gemini_client.generateContent(prompt);
	return geminiResult.response.text();
}
