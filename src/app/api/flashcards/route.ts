import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback } from '@/lib/gemini';
import { Flashcard } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { context, files, count = 12, topic, apiKey, model } = await req.json();

    if (!context && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: 'Contexto o documentos no proporcionados' },
        { status: 400 }
      );
    }

    const targetCount = [8, 12, 20].includes(Number(count)) ? Number(count) : 12;
    const ai = getGeminiClient(apiKey);

    const prompt = `
Eres un pedagogo experto en técnicas de estudio activo y repetición espaciada.

TAREA: Genera exactamente ${targetCount} tarjetas de estudio (flashcards) con los conceptos más importantes y fundamentales extraídos del contenido de los documentos.
${topic ? `Enfócate prioritariamente en el tema: "${topic}".` : ''}

REGLAS PARA CADA FLASHCARD:
1. 'front': Concepto clave, término, pregunta directa o fórmula (conciso y directo).
2. 'back': Definición clara, explicación esencial o respuesta (máximo 2-3 oraciones bien sintetizadas).
3. 'sourceDoc' y 'sourcePage': Deben indicar con precisión de qué documento y página proviene el concepto.

Devuelve EXCLUSIVAMENTE un arreglo JSON válido:
[
  {
    "id": "card-1",
    "front": "¿Qué es X?",
    "back": "X es...",
    "sourceDoc": "Documento.pdf",
    "sourcePage": 4
  }
]

${context ? `TEXTO DE LOS DOCUMENTOS:\n=========================================\n${context}\n=========================================` : ''}
`;

    const userParts: any[] = [];
    if (Array.isArray(files) && files.length > 0) {
      for (const f of files) {
        if (f.fileUri) {
          userParts.push({
            fileData: {
              fileUri: f.fileUri,
              mimeType: f.mimeType || 'application/pdf',
            },
          });
        }
      }
    }
    userParts.push({ text: prompt });

    const response = await generateContentWithFallback(ai, model || 'gemini-3.8-flash', {
      contents: [{ role: 'user', parts: userParts }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text?.trim() || '[]';
    const flashcards: Flashcard[] = JSON.parse(raw);

    return NextResponse.json({ flashcards });
  } catch (error: any) {
    console.error('Error en /api/flashcards:', error);
    const isApiKeyError = error?.message?.includes('MISSING_API_KEY') || error?.message?.includes('API_KEY_INVALID');
    return NextResponse.json(
      {
        error: isApiKeyError
          ? 'Clave de API no configurada o inválida. Por favor, revisa tus ajustes.'
          : error.message || 'Error al generar tarjetas de estudio',
      },
      { status: isApiKeyError ? 401 : 500 }
    );
  }
}
