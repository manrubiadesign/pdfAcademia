import { UploadedPDF, PDFPage } from '@/types';

export async function parsePdfFile(file: File): Promise<UploadedPDF> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import for pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages: PDFPage[] = [];
  let totalChars = 0;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const charCount = pageText.length;
    totalChars += charCount;

    pages.push({
      pageNumber: i,
      text: pageText,
      charCount,
    });
  }

  // Detect scanned or empty PDF (e.g., less than 60 total characters across several pages)
  const isScanned = totalChars < 50 || (totalPages > 1 && totalChars / totalPages < 20);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    size: file.size,
    totalPages,
    pages,
    totalChars,
    isScanned,
    uploadDate: Date.now(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildContextSnippet(
  documents: UploadedPDF[],
  maxChars = 250000
): { text: string; isPartial: boolean; totalAvailableChars: number } {
  let accumulated = '';
  let isPartial = false;
  let totalAvailableChars = 0;

  for (const doc of documents) {
    totalAvailableChars += doc.totalChars;
    for (const page of doc.pages) {
      if (!page.text || page.text.trim().length === 0) continue;
      
      const snippet = `\n--- INICIO PÁGINA [Documento: "${doc.name}", Página: ${page.pageNumber}] ---\n${page.text}\n--- FIN PÁGINA [Documento: "${doc.name}", Página: ${page.pageNumber}] ---\n`;
      
      if (accumulated.length + snippet.length > maxChars) {
        isPartial = true;
        break;
      }
      accumulated += snippet;
    }
    if (isPartial) break;
  }

  return { text: accumulated, isPartial, totalAvailableChars };
}
