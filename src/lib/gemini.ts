import { GoogleGenerativeAI } from '@google/generative-ai';

// Mapa de sustitución para versiones deprecadas
const DEPRECATED_MODELS: Record<string, string> = {
  'gemini-2.0-flash': 'gemini-3.8-flash',
  'gemini-2.0-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-1.5-flash': 'gemini-3.8-flash',
  'gemini-1.5-pro': 'gemini-3.8-pro',
};

export function getGeminiModel(apiKey?: string, modelName = 'gemini-3.8-flash') {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'MISSING_API_KEY: Debes configurar tu clave de API de Gemini (en .env.local como GEMINI_API_KEY o en los Ajustes de la aplicación).'
    );
  }

  // Si el frontend envía un modelo obsoleto o vacío, mapea al actual
  const resolvedModel = DEPRECATED_MODELS[modelName] || modelName || 'gemini-3.8-flash';

  const genAI = new GoogleGenerativeAI(key);

  return genAI.getGenerativeModel({
    model: resolvedModel,
  });
}
