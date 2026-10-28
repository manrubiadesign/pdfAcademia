import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const apiKey = (formData.get('apiKey') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo PDF' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient(apiKey);

    // Convert file to Blob for GoogleGenAI SDK
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

    // Upload directly to Gemini Cloud Files
    const uploadResult = await ai.files.upload({
      file: blob,
      config: {
        mimeType: 'application/pdf',
        displayName: file.name,
      },
    });

    return NextResponse.json({
      fileUri: uploadResult.uri,
      name: uploadResult.name,
      displayName: uploadResult.displayName || file.name,
      size: file.size,
      mimeType: uploadResult.mimeType || 'application/pdf',
    });
  } catch (error: any) {
    console.error('Error en /api/upload:', error);
    return NextResponse.json(
      {
        error: error.message || 'No se pudo subir el archivo a la nube de Gemini',
      },
      { status: 500 }
    );
  }
}
