import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback } from '@/lib/gemini';
import { ExamConfig, ExamQuestion } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { context, files, config, apiKey, model }: { context: string; files?: { fileUri: string; mimeType?: string }[]; config: ExamConfig; apiKey?: string; model?: string } = await req.json();

    if ((!context && (!files || files.length === 0)) || !config) {
      return NextResponse.json(
        { error: 'Contexto, documentos o configuración no proporcionados' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient(apiKey);

    const questionTypeDescription = {
      test: 'Preguntas de opción múltiple (tipo test) con exactamente 4 opciones ("A) ...", "B) ...", "C) ...", "D) ...") y una única opción correcta.',
      boolean: 'Afirmaciones de Verdadero o Falso. El campo correctAnswer debe ser exactamente "Verdadero" o "Falso".',
      short: 'Preguntas de respuesta corta donde el alumno deberá redactar una respuesta. El campo correctAnswer debe contener la respuesta modelo ideal esperada.',
      mixed: 'Combinación equilibrada de preguntas tipo test (4 opciones), verdadero/falso y respuesta corta.',
    }[config.type] || 'Preguntas tipo test con 4 opciones';

    const prompt = `
Eres un profesor universitario experto elaborando un examen riguroso para tus alumnos, basado ÚNICAMENTE en el siguiente contenido de los documentos PDF.

DIRECTIVAS ESPECÍFICAS:
1. Número exacto de preguntas: ${config.count} preguntas.
2. Nivel de dificultad: ${config.difficulty.toUpperCase()} (fácil = conceptos directos; media = comprensión y aplicación; difícil = análisis detallado y matices específicos).
3. Tema o enfoque específico: ${config.topic ? `"${config.topic}"` : 'Todo el material general de los documentos'}.
4. Formato de preguntas: ${questionTypeDescription}
5. RIGOR Y FUENTE: Cada pregunta DEBE basarse estrictamente en hechos reales del texto provisto. Indica el nombre del documento (sourceDoc) y la página (sourcePage) de donde se extrae la información.
6. EXPLICACIÓN: Cada pregunta debe incluir una explicación clara y pedagógica justificando la respuesta correcta.

Devuelve EXCLUSIVAMENTE un arreglo JSON válido (sin texto antes ni después) con la siguiente estructura:
[
  {
    "id": "q-1",
    "type": "test" | "boolean" | "short",
    "question": "Enunciado claro de la pregunta",
    "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"], // solo para tipo "test"
    "correctAnswer": "A) Opción 1" o "Verdadero" / "Falso" o la respuesta modelo en texto si es "short",
    "explanation": "Justificación fundamentada en el texto...",
    "sourceDoc": "NombreDocumento.pdf",
    "sourcePage": 5
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

    const rawText = response.text?.trim() || '[]';
    const questions: ExamQuestion[] = JSON.parse(rawText);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Error en /api/exam:', error);
    const isApiKeyError = error?.message?.includes('MISSING_API_KEY') || error?.message?.includes('API_KEY_INVALID');
    return NextResponse.json(
      {
        error: isApiKeyError
          ? 'Clave de API no configurada o inválida. Por favor, revisa tus ajustes.'
          : error.message || 'Error al generar el examen',
      },
      { status: isApiKeyError ? 401 : 500 }
    );
  }
}
