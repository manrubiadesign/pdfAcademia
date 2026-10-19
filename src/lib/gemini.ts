import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiModel(apiKey?: string, modelName = 'gemini-2.5-flash') {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('MISSING_API_KEY: Debes configurar tu clave de API de Gemini (en .env.local como GEMINI_API_KEY o en los Ajustes de la aplicación).');
  }

  const genAI = new GoogleGenerativeAI(key);
  // Default to gemini-2.5-flash or gemini-1.5-flash
  return genAI.getGenerativeModel({
    model: modelName || 'gemini-2.5-flash',
  });
}
