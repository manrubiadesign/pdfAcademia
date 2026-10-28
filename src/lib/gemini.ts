import { GoogleGenAI } from '@google/genai';

// Mapa de sustitución para versiones no disponibles o retiradas
const DEPRECATED_MODELS: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-3.8-flash',
  'gemini-2.5-pro': 'gemini-3.8-flash',
  'gemini-2.0-flash': 'gemini-3.8-flash',
  'gemini-2.0-flash-lite': 'gemini-3.8-flash',
  'gemini-2.0-flash-001': 'gemini-3.8-flash',
  'gemini-1.5-flash': 'gemini-3.8-flash',
  'gemini-1.5-pro': 'gemini-3.8-flash',
};

export function getGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'MISSING_API_KEY: Debes configurar tu clave de API de Gemini (en .env.local como GEMINI_API_KEY o en los Ajustes de la aplicación).'
    );
  }

  return new GoogleGenAI({ apiKey: key });
}

export function normalizeModelName(name?: string): string {
  if (!name) return 'gemini-3.8-flash';
  const clean = name.trim().toLowerCase();
  
  if (DEPRECATED_MODELS[clean]) {
    return DEPRECATED_MODELS[clean];
  }

  if (clean.includes('1.5') || clean.includes('2.0') || clean.includes('2.5')) {
    return 'gemini-3.8-flash';
  }
  
  return clean;
}
