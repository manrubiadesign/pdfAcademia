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

/**
 * Ejecuta generateContent con fallback automático ante errores 503 (alta demanda) o 429.
 * Si el modelo principal está saturado temporalmente en Google, prueba alternativas estables.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  params: {
    contents: any;
    config?: any;
  }
) {
  const initial = normalizeModelName(preferredModel);
  // Lista de modelos alternativos en caso de sobrecarga
  const candidateModels = Array.from(
    new Set([initial, 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'])
  );

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || '';
      const isHighDemand =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('temporarily') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('429');

      if (isHighDemand && i < candidateModels.length - 1) {
        console.warn(`[Gemini Fallback] El modelo ${currentModel} tiene alta demanda en Google. Probando con ${candidateModels[i + 1]}...`);
        // Pequeña pausa antes de reintentar con el siguiente modelo
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      // Si no es un error de saturación temporal, relanzar
      throw err;
    }
  }

  throw lastError;
}
