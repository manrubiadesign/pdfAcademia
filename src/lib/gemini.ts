import { GoogleGenAI } from '@google/genai';

// Mapa de sustitución para versiones no disponibles o retiradas
const DEPRECATED_MODELS: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-3.8-flash',
  'gemini-2.5-pro': 'gemini-3.8-flash',
  'gemini-2.0-flash': 'gemini-3.8-flash',
  'gemini-2.0-flash-lite': 'gemini-3.1-flash-lite',
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
 * Función que detecta si el error es de saturación o alta demanda temporal en Google.
 */
function isOverloadedError(err: any): boolean {
  const text = (typeof err === 'string' ? err : err?.message || JSON.stringify(err)).toLowerCase();
  return (
    text.includes('503') ||
    text.includes('high demand') ||
    text.includes('unavailable') ||
    text.includes('temporarily') ||
    text.includes('resource_exhausted') ||
    text.includes('429') ||
    text.includes('overloaded')
  );
}

/**
 * Convierte cualquier error técnico de Google en un mensaje pedagógico y comprensible.
 */
export function formatFriendlyErrorMessage(error: any): { message: string; statusCode: number } {
  const rawMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
  const lower = rawMsg.toLowerCase();

  if (lower.includes('missing_api_key') || lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return {
      message: 'Clave de API no configurada o inválida. Por favor, revisa tus ajustes (icono ⚙️).',
      statusCode: 401,
    };
  }

  if (isOverloadedError(error)) {
    return {
      message: 'Google Gemini está recibiendo un pico de tráfico mundial temporal en sus servidores. Los reintentos automáticos no pudieron completarse; por favor espera unos segundos y vuelve a pulsar.',
      statusCode: 503,
    };
  }

  return {
    message: rawMsg || 'Error inesperado al comunicarse con la IA',
    statusCode: 500,
  };
}

/**
 * Ejecuta generateContent con reintentos y fallback en cascada ante picos de demanda (503/429).
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

  // Lista jerárquica de modelos:
  // 1. Modelo preferido (ej: gemini-3.8-flash)
  // 2. Modelo Flash-Lite de máxima disponibilidad (diseñado por Google para absorber alto volumen sin 503)
  // 3. gemini-3.5-flash
  // 4. gemini-flash-latest
  const candidateModels = Array.from(
    new Set([initial, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'])
  );

  let lastError: any = null;

  for (const currentModel of candidateModels) {
    // Para cada modelo, intentamos hasta 2 veces con backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;

        if (isOverloadedError(err)) {
          console.warn(
            `[Gemini Fallback] Modelo ${currentModel} (intento ${attempt}/2) con alta demanda temporal en Google. Reintentando...`
          );
          if (attempt === 1) {
            // Pausa de 1.5s antes del segundo intento con el mismo modelo
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          // Si el segundo intento falló, pasa al siguiente modelo
          break;
        }

        // Si es un error no recuperable con reintento, relanzar
        throw err;
      }
    }
  }

  throw lastError;
}
