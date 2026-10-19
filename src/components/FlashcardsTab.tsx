'use client';

import React, { useState } from 'react';
import { 
  Layers, Shuffle, ChevronLeft, ChevronRight, RotateCw, 
  Sparkles, BookOpen, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard, UploadedPDF } from '@/types';

interface FlashcardsTabProps {
  documents: UploadedPDF[];
  flashcards: Flashcard[];
  onGenerateFlashcards: (count: number, topic?: string) => Promise<Flashcard[]>;
  onSaveFlashcards: (cards: Flashcard[]) => void;
  onOpenDocuments: () => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  documents,
  flashcards,
  onGenerateFlashcards,
  onSaveFlashcards,
  onOpenDocuments,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [targetCount, setTargetCount] = useState<number>(12);
  const [topic, setTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (documents.length === 0) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setIsFlipped(false);

    try {
      const generated = await onGenerateFlashcards(targetCount, topic);
      onSaveFlashcards(generated);
      setCurrentIndex(0);
    } catch (err: any) {
      console.error('Error generando flashcards:', err);
      setErrorMsg(err.message || 'Error al generar tarjetas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShuffle = () => {
    if (flashcards.length <= 1) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    onSaveFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (flashcards.length === 0) return;
    const updated = [...flashcards];
    updated[currentIndex].mastered = !updated[currentIndex].mastered;
    onSaveFlashcards(updated);

    if (updated[currentIndex].mastered) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const handleNext = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Sube documentos para crear tarjetas</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Sube tus archivos PDF para que la IA extraiga los conceptos y definiciones clave en tarjetas de estudio memorizables.
        </p>
        <button
          onClick={onOpenDocuments}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          Ir a subir documentos
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const masteredCount = flashcards.filter((c) => c.mastered).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Config header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              <span>Tarjetas de Estudio Interactivas (Flashcards)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera flashcards con conceptos clave basados en tus PDFs para estudio activo y repaso rápido
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              isGenerating
                ? 'bg-indigo-400 text-white cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generando tarjetas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{flashcards.length > 0 ? 'Generar nuevas tarjetas' : 'Generar tarjetas'}</span>
              </>
            )}
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Número de tarjetas
            </label>
            <div className="flex items-center space-x-2">
              {[8, 12, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTargetCount(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    targetCount === num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num} tarjetas
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tema / Enfoque específico (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Glosario, Fórmulas, Capítulo 4..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-500 hover:text-rose-800">✕</button>
        </div>
      )}

      {/* Flashcard viewer */}
      {flashcards.length > 0 ? (
        <div className="space-y-4">
          {/* Top stats bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="font-semibold text-slate-700">
              Tarjeta {currentIndex + 1} de {flashcards.length}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-emerald-600 font-medium">
                ✓ {masteredCount} dominadas ({Math.round((masteredCount / flashcards.length) * 100)}%)
              </span>
              <button
                onClick={handleShuffle}
                className="inline-flex items-center space-x-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Barajar</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer select-none"
          >
            <div
              className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT (Concepto / Pregunta) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-lg shadow-slate-100 hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                    Concepto / Pregunta
                  </span>
                  <button
                    onClick={handleToggleMastered}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                      currentCard.mastered
                        ? 'bg-emerald-100 text-emerald-800 font-semibold'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{currentCard.mastered ? 'Aprendida' : 'Marcar como aprendida'}</span>
                  </button>
                </div>

                <div className="my-auto text-center px-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5 text-indigo-600 font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{currentCard.sourceDoc}, pág. {currentCard.sourcePage}</span>
                  </div>
                  <span className="flex items-center space-x-1 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Toca para ver respuesta</span>
                  </span>
                </div>
              </div>

              {/* BACK (Definición / Explicación) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                    Definición / Explicación
                  </span>
                  <button
                    onClick={handleToggleMastered}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                      currentCard.mastered
                        ? 'bg-emerald-500 text-white font-semibold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{currentCard.mastered ? 'Aprendida' : 'Marcar como aprendida'}</span>
                  </button>
                </div>

                <div className="my-auto text-center px-4">
                  <p className="text-base sm:text-lg text-indigo-50 leading-relaxed font-medium">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-200 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{currentCard.sourceDoc}, pág. {currentCard.sourcePage}</span>
                  </div>
                  <span className="flex items-center space-x-1 text-indigo-300">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Toca para volver</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 pt-2">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              title="Anterior tarjeta"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-colors flex items-center space-x-2"
            >
              <RotateCw className="w-4 h-4 text-indigo-600" />
              <span>Girar tarjeta</span>
            </button>

            <button
              onClick={handleNext}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              title="Siguiente tarjeta"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Aún no has generado tarjetas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Pulsa el botón de arriba para extraer automáticamente los conceptos más relevantes de tus documentos en flashcards.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Generar {targetCount} tarjetas ahora
          </button>
        </div>
      )}
    </div>
  );
};
