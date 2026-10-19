'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Trash2, CheckCircle2, RefreshCw, Info, Sparkles } from 'lucide-react';
import { UploadedPDF } from '@/types';
import { parsePdfFile, formatFileSize } from '@/lib/pdfParser';

interface DocumentManagerProps {
  documents: UploadedPDF[];
  onAddDocument: (doc: UploadedPDF) => void;
  onRemoveDocument: (id: string) => void;
  onClearAll: () => void;
  onStartStudying: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
  onClearAll,
  onStartStudying,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCharacters = documents.reduce((acc, d) => acc + d.totalChars, 0);
  const maxRecommendedChars = 300000;
  const usagePercentage = Math.min(100, Math.round((totalCharacters / maxRecommendedChars) * 100));

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          setErrorMsg(`El archivo "${file.name}" no es un documento PDF válido.`);
          continue;
        }

        setProcessingStatus(`Extrayendo texto página a página de "${file.name}"...`);
        const parsed = await parsePdfFile(file);
        onAddDocument(parsed);
      }
    } catch (err: any) {
      console.error('Error parseando PDF:', err);
      setErrorMsg(`Error procesando PDF: ${err.message || 'El archivo está dañado o no se puede leer.'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aprendizaje 100% fiel a tus textos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sube tus apuntes, manuales o libros en PDF
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            La inteligencia artificial responde <strong>únicamente</strong> con el contenido de los documentos subidos,
            citando siempre el documento y la página exacta. Si un dato no figura en los textos, lo avisará en lugar de inventarlo.
          </p>
        </div>
      </div>

      {/* Scanned PDFs Warning Banner if any */}
      {documents.some((d) => d.isScanned) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">PDFs escaneados o sin texto seleccionable detectados</p>
            <p className="text-amber-700 mt-0.5">
              Algunos de los documentos subidos apenas contienen texto legible por ordenador. La app necesita que el PDF contenga texto seleccionable (no fotografías de páginas sin OCR previo) para responder preguntas o generar exámenes con precisión.
            </p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
        }`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            {isProcessing ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-slate-800">
              {isProcessing ? processingStatus : 'Arrastra y suelta tus PDFs aquí'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              o haz clic para seleccionar archivos desde tu dispositivo (admite selección múltiple)
            </p>
          </div>

          <div className="inline-flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <Info className="w-3.5 h-3.5" />
            <span>Extracción de texto 100% privada en el navegador vía pdf.js</span>
          </div>
        </div>
      </div>

      {/* Documents Status and List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          {/* Capacity Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">
                Capacidad de contexto utilizada: {totalCharacters.toLocaleString()} / {maxRecommendedChars.toLocaleString()} caracteres
              </span>
              <span className={`font-bold ${usagePercentage > 90 ? 'text-amber-600' : 'text-slate-500'}`}>
                {usagePercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  usagePercentage > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            {usagePercentage >= 90 && (
              <p className="text-xs text-amber-600 mt-2">
                Recomendación: para bibliotecas masivas se aconseja segmentar o estudiar por bloques temáticos.
              </p>
            )}
          </div>

          {/* Document Cards */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Documentos subidos ({documents.length})</span>
            </h2>
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar todos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between shadow-xs hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start space-x-3 overflow-hidden">
                  <div className={`p-2.5 rounded-lg shrink-0 ${doc.isScanned ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-1">
                      <span>{doc.totalPages} páginas</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{doc.totalChars.toLocaleString()} caracteres</span>
                    </div>

                    {doc.isScanned ? (
                      <span className="inline-flex items-center space-x-1 mt-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Sin texto detectable (posible escaneo)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Texto extraído y listo</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveDocument(doc.id)}
                  title="Eliminar documento"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick action button to start studying */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onStartStudying}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              <span>Comenzar preguntas y exámenes</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
