'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, Play, CheckCircle2, XCircle, RotateCcw, 
  Printer, HelpCircle, ChevronRight, Sparkles, BookOpen, 
  AlertCircle, Award, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamConfig, ExamQuestion, ExamState, UploadedPDF } from '@/types';

interface ExamTabProps {
  documents: UploadedPDF[];
  onGenerateExam: (config: ExamConfig) => Promise<ExamQuestion[]>;
  onGradeShortAnswer: (question: string, modelAnswer: string, userAnswer: string) => Promise<{
    score: 'correct' | 'partial' | 'incorrect';
    isCorrect: boolean;
    feedback: string;
  }>;
  onOpenDocuments: () => void;
}

export const ExamTab: React.FC<ExamTabProps> = ({
  documents,
  onGenerateExam,
  onGradeShortAnswer,
  onOpenDocuments,
}) => {
  // Config state
  const [examType, setExamType] = useState<ExamConfig['type']>('test');
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<ExamConfig['difficulty']>('media');
  const [topic, setTopic] = useState<string>('');

  // Active exam state
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review mode state: only failed questions
  const [failedOnlyMode, setFailedOnlyMode] = useState(false);
  const [failedQuestionIds, setFailedQuestionIds] = useState<string[]>([]);

  const handleStartExam = async () => {
    if (documents.length === 0) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setFailedOnlyMode(false);
    setFailedQuestionIds([]);

    try {
      const generated = await onGenerateExam({
        type: examType,
        count,
        difficulty,
        topic,
      });

      setQuestions(generated);
      setUserAnswers({});
      setIsSubmitted(false);
    } catch (err: any) {
      console.error('Error generando examen:', err);
      setErrorMsg(err.message || 'No se pudo generar el examen');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleGradeExam = async () => {
    setIsGrading(true);
    setErrorMsg(null);

    try {
      const updatedQuestions: ExamQuestion[] = [];

      for (const q of questions) {
        const ans = userAnswers[q.id] || '';
        let isCorrect = false;
        let score: 'correct' | 'partial' | 'incorrect' = 'incorrect';
        let aiFeedback = '';

        if (q.type === 'test') {
          // Compare answer
          const normalizedUser = ans.trim().toLowerCase();
          const normalizedCorrect = q.correctAnswer.trim().toLowerCase();
          isCorrect = normalizedUser === normalizedCorrect || 
            (normalizedUser.startsWith('a') && normalizedCorrect.startsWith('a')) ||
            (normalizedUser.startsWith('b') && normalizedCorrect.startsWith('b')) ||
            (normalizedUser.startsWith('c') && normalizedCorrect.startsWith('c')) ||
            (normalizedUser.startsWith('d') && normalizedCorrect.startsWith('d'));
          score = isCorrect ? 'correct' : 'incorrect';
        } else if (q.type === 'boolean') {
          isCorrect = ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          score = isCorrect ? 'correct' : 'incorrect';
        } else if (q.type === 'short') {
          // Grade with AI
          if (ans.trim().length > 0) {
            const evalResult = await onGradeShortAnswer(q.question, q.correctAnswer, ans);
            isCorrect = evalResult.isCorrect;
            score = evalResult.score;
            aiFeedback = evalResult.feedback;
          } else {
            isCorrect = false;
            score = 'incorrect';
            aiFeedback = 'No se proporcionó respuesta.';
          }
        }

        updatedQuestions.push({
          ...q,
          userAnswer: ans,
          isCorrect,
          score,
          aiFeedback,
        });
      }

      setQuestions(updatedQuestions);
      setIsSubmitted(true);

      const failedIds = updatedQuestions.filter((q) => !q.isCorrect).map((q) => q.id);
      setFailedQuestionIds(failedIds);

      // Trigger celebratory confetti if passed >= 70%
      const correctCount = updatedQuestions.filter((q) => q.isCorrect).length;
      if (correctCount / updatedQuestions.length >= 0.7) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error('Error al corregir examen:', err);
      setErrorMsg(err.message || 'Error al evaluar respuestas');
    } finally {
      setIsGrading(false);
    }
  };

  const handleReviewFailed = () => {
    // Keep only the failed questions, reset their answers and submit state
    const failedOnes = questions.filter((q) => failedQuestionIds.includes(q.id));
    setQuestions(failedOnes);
    setUserAnswers({});
    setIsSubmitted(false);
    setFailedOnlyMode(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Sube documentos para generar exámenes</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Necesitamos los apuntes o libros para que la IA elabore preguntas con rigor basadas únicamente en su contenido.
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

  const displayedQuestions = questions;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Header (when no questions or when generating new) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Generador de Exámenes con IA</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Preguntas generadas y corregidas estrictamente con el material de tus PDFs
            </p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={isGenerating || isGrading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              isGenerating
                ? 'bg-indigo-400 text-white cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generando examen...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{questions.length > 0 ? 'Crear otro examen' : 'Generar examen'}</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          {/* Tipo de examen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de examen
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="test">Tipo Test (4 opciones)</option>
              <option value="boolean">Verdadero / Falso</option>
              <option value="short">Respuesta Corta (redacción)</option>
              <option value="mixed">Mixto (combinado)</option>
            </select>
          </div>

          {/* Número de preguntas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nº de preguntas ({count})
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value={5}>5 preguntas</option>
              <option value={8}>8 preguntas</option>
              <option value={10}>10 preguntas</option>
              <option value={12}>12 preguntas</option>
              <option value={15}>15 preguntas</option>
            </select>
          </div>

          {/* Dificultad */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dificultad
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="facil">Fácil (Conceptos clave)</option>
              <option value="media">Media (Comprensión estándar)</option>
              <option value="dificil">Difícil (Análisis y detalles)</option>
            </select>
          </div>

          {/* Tema opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tema / Capítulo (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Capítulo 2, Sistema solar..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between no-print">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-500 hover:text-rose-800">✕</button>
        </div>
      )}

      {/* Results banner if submitted */}
      {isSubmitted && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${
              scorePercent >= 70 ? 'bg-emerald-100 text-emerald-700' : scorePercent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {scorePercent}%
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg">
                  {scorePercent >= 70 ? '¡Excelente resultado!' : scorePercent >= 50 ? 'Aprobado, buen intento' : 'Necesita repaso'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {correctCount} de {questions.length} correctas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Revisa las explicaciones y las citas de cada página para afianzar el conocimiento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {failedQuestionIds.length > 0 && !failedOnlyMode && (
              <button
                onClick={handleReviewFailed}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repasar falladas ({failedQuestionIds.length})</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Descargar / Imprimir examen</span>
            </button>
          </div>
        </div>
      )}

      {/* Review mode indicator */}
      {failedOnlyMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Modo repaso activo: practicando únicamente las preguntas falladas</span>
          </div>
          <button
            onClick={() => setFailedOnlyMode(false)}
            className="text-amber-900 hover:underline"
          >
            Ver todas
          </button>
        </div>
      )}

      {/* Printable Title Header */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold">Examen: {topic || 'Evaluación de estudio'}</h1>
        <p className="text-sm text-gray-600">
          Documentos evaluados: {documents.map((d) => d.name).join(', ')}
        </p>
        <p className="text-xs text-gray-400 mt-1">Generado con Estudio con PDFs</p>
        <hr className="my-3 border-gray-300" />
      </div>

      {/* Questions List */}
      {displayedQuestions.length > 0 && (
        <div className="space-y-5">
          {displayedQuestions.map((q, qIndex) => {
            const isUserCorrect = isSubmitted && q.isCorrect;
            const isUserWrong = isSubmitted && !q.isCorrect;

            return (
              <div
                key={q.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs transition-all ${
                  isSubmitted
                    ? isUserCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Question title & header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                      {qIndex + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base leading-snug">
                        {q.question}
                      </h3>
                      <span className="inline-block mt-1 text-[11px] font-medium text-slate-400">
                        {q.type === 'test' && 'Opción múltiple'}
                        {q.type === 'boolean' && 'Verdadero o Falso'}
                        {q.type === 'short' && 'Respuesta abierta'}
                      </span>
                    </div>
                  </div>

                  {isSubmitted && (
                    <div className="shrink-0 no-print">
                      {isUserCorrect ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correcta</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrecta</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Option Multi-choice */}
                {q.type === 'test' && q.options && (
                  <div className="space-y-2.5 mt-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id] === opt;
                      const isOptionCorrect = q.correctAnswer === opt || q.correctAnswer.startsWith(opt.substring(0, 2));

                      let optClass = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700';

                      if (isSubmitted) {
                        if (isOptionCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
                        } else if (isSelected && !isOptionCorrect) {
                          optClass = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                        } else {
                          optClass = 'border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        optClass = 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-medium shadow-xs';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${optClass}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isOptionCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Boolean (Verdadero / Falso) */}
                {q.type === 'boolean' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {['Verdadero', 'Falso'].map((val) => {
                      const isSelected = userAnswers[q.id] === val;
                      const isValCorrect = q.correctAnswer.toLowerCase() === val.toLowerCase();

                      let btnClass = 'border-slate-200 hover:border-indigo-300 text-slate-700';

                      if (isSubmitted) {
                        if (isValCorrect) {
                          btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isSelected && !isValCorrect) {
                          btnClass = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                        } else {
                          btnClass = 'border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnClass = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
                      }

                      return (
                        <button
                          key={val}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, val)}
                          className={`p-3 rounded-xl border text-sm text-center font-medium transition-all ${btnClass}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short answer input */}
                {q.type === 'short' && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      disabled={isSubmitted}
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleSelectOption(q.id, e.target.value)}
                      rows={3}
                      placeholder="Escribe tu respuesta aquí (la IA la evaluará comparándola con la respuesta modelo)..."
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                    />

                    {isSubmitted && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700">Respuesta modelo esperada:</span>
                          <p className="text-slate-600 mt-0.5">{q.correctAnswer}</p>
                        </div>
                        {q.aiFeedback && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="font-bold text-indigo-700">Comentario y corrección de la IA:</span>
                            <p className="text-slate-700 mt-0.5">{q.aiFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation and Citation (shown after submission) */}
                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Explicación: </strong>
                      {q.explanation}
                    </div>

                    <div className="shrink-0 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 self-start sm:self-auto">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{q.sourceDoc}, pág. {q.sourcePage}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit button bar */}
          {!isSubmitted && (
            <div className="pt-4 flex justify-end no-print">
              <button
                onClick={handleGradeExam}
                disabled={isGrading}
                className={`px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 ${
                  isGrading
                    ? 'bg-emerald-400 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {isGrading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Evaluando respuestas con IA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Corregir examen</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
