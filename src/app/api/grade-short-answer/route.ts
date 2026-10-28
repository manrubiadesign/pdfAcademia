import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { question, modelAnswer, userAnswer, apiKey, model } = await req.json();

    if (!question || !modelAnswer || userAnswer === undefined) {
      return NextResponse.json(
        { error: 'Parámetros incompletos para corregir respuesta' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient(apiKey);

    const prompt = `
Eres un evaluador académico imparcial y formativo.

TAREA: Evalúa la respuesta que un alumno ha escrito para una pregunta abierta, comparándola con la respuesta modelo de referencia.

Pregunta: "${question}"
Respuesta modelo (esperada): "${modelAnswer}"
Respuesta escrita por el alumno: "${userAnswer}"

CRITERIOS:
- 'correct': El alumno ha transmitido los conceptos esenciales clave, aunque use sus propias palabras.
- 'partial': El alumno ha acertado parcialmente pero ha omitido matices importantes o contiene imprecisiones menores.
- 'incorrect': La respuesta es errónea, inventada, vacía o no responde a la pregunta.

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma:
{
  "score": "correct" | "partial" | "incorrect",
  "isCorrect": true | false (true para correct o partial positivo, false para incorrect),
  "feedback": "Comentario pedagógico breve (1-2 oraciones) indicando qué estuvo bien y qué faltó."
}
`;

    const response = await generateContentWithFallback(ai, model || 'gemini-3.8-flash', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    const evaluation = JSON.parse(rawText);

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('Error en /api/grade-short-answer:', error);
    return NextResponse.json(
      { error: error.message || 'Error evaluando respuesta' },
      { status: 500 }
    );
  }
}
