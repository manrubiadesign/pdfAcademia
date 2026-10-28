import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, normalizeModelName } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { context, messages, apiKey, model } = await req.json();

    if (!context || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Contexto o mensajes no proporcionados' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient(apiKey);
    const activeModel = normalizeModelName(model);

    const systemInstruction = `
Eres un tutor académico riguroso y asistente de estudio basado EXCLUSIVAMENTE en el contenido de los documentos PDF subidos por el alumno.

NORMAS CRÍTICAS E INQUEBRANTABLES:
1. RESPONDE ÚNICAMENTE CON EL CONTENIDO DE LOS DOCUMENTOS: No uses conocimientos externos ni inventes datos bajo ninguna circunstancia.
2. CITACIÓN OBLIGATORIA: En cada afirmación, respuesta o dato, indica explícitamente el documento y la página exacta de donde sale la información en el formato: [NombreDelDocumento, pág. X] o [pág. X].
3. NO ALUCINAR: Si la respuesta a la pregunta del usuario no está explícitamente en el contenido de los documentos, DEBES responder exactamente o similar a: "Esta información no aparece en los documentos subidos." No intentes responder con conocimientos generales.
4. MANTÉN UN TONO claro, pedagógico, ordenado y estructurado con viñetas cuando convenga.

A continuación tienes el texto íntegro extraído de los documentos del usuario:
=========================================
${context}
=========================================
`;

    // Format conversation history for GoogleGenAI
    const contents: any[] = [];
    
    // Add history
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Add current user prompt
    const lastUserMessage = messages[messages.length - 1].content;
    contents.push({
      role: 'user',
      parts: [{ text: lastUserMessage }],
    });

    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const text = response.text || '';
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    const isApiKeyError = error?.message?.includes('MISSING_API_KEY') || error?.message?.includes('API_KEY_INVALID');
    return NextResponse.json(
      {
        error: isApiKeyError
          ? 'Clave de API no configurada o inválida. Por favor, revisa tus ajustes.'
          : error.message || 'Error al generar la respuesta',
      },
      { status: isApiKeyError ? 401 : 500 }
    );
  }
}
