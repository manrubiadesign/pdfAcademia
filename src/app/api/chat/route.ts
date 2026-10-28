import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback, formatFriendlyErrorMessage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { context, files, messages, apiKey, model } = await req.json();

    if ((!context && (!files || files.length === 0)) || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Contexto, documentos o mensajes no proporcionados' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient(apiKey);

    const systemInstruction = `
Eres un tutor académico riguroso y asistente de estudio basado EXCLUSIVAMENTE en el contenido de los documentos PDF subidos por el alumno.

NORMAS CRÍTICAS E INQUEBRANTABLES:
1. RESPONDE ÚNICAMENTE CON EL CONTENIDO DE LOS DOCUMENTOS: No uses conocimientos externos ni inventes datos bajo ninguna circunstancia.
2. CITACIÓN OBLIGATORIA: En cada afirmación, respuesta o dato, indica explícitamente el documento y la página exacta de donde sale la información en el formato: [NombreDelDocumento, pág. X] o [pág. X].
3. NO ALUCINAR: Si la respuesta a la pregunta del usuario no está explícitamente en el contenido de los documentos, DEBES responder exactamente o similar a: "Esta información no aparece en los documentos subidos." No intentes responder con conocimientos generales.
4. MANTÉN UN TONO claro, pedagógico, ordenado y estructurado con viñetas cuando convenga.

${context ? `A continuación tienes texto de referencia de los documentos:\n=========================================\n${context}\n=========================================` : ''}
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

    // Add current user prompt with attached Cloud Files if available
    const lastUserMessage = messages[messages.length - 1].content;
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

    userParts.push({ text: `${systemInstruction}\n\nPregunta del alumno: ${lastUserMessage}` });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const response = await generateContentWithFallback(ai, model, {
      contents,
    });

    const text = response.text || '';
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    const { message, statusCode } = formatFriendlyErrorMessage(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
