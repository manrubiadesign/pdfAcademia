'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Sparkles, BookOpen, AlertCircle, Bookmark, Copy, Check } from 'lucide-react';
import { ChatMessage, UploadedPDF } from '@/types';
import { buildContextSnippet } from '@/lib/pdfParser';

interface ChatTabProps {
  documents: UploadedPDF[];
  messages: ChatMessage[];
  onSendMessage: (userText: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  onOpenDocuments: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  documents,
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  onOpenDocuments,
}) => {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sampleQuestions = [
    '¿Cuál es el resumen principal de este contenido?',
    'Explícame los conceptos fundamentales explicados en el texto.',
    '¿Qué conclusiones o puntos clave se destacan al final?',
    'Enumera las definiciones más importantes con su página.',
  ];

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No hay documentos subidos todavía</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Sube al menos un PDF con texto seleccionable para empezar a realizar consultas con citas de página precisas.
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

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar of the chat */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Consultando {documents.length} documento{documents.length > 1 ? 's' : ''} activo{documents.length > 1 ? 's' : ''}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center space-x-1.5 transition-colors"
            title="Borrar historial del chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Nueva conversación</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">¿Qué deseas saber de tus PDFs?</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                La IA responderá citando el documento y la página exacta. Si una información no aparece en tus documentos, te lo dirá con total honestidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full text-left">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  className="p-3 text-xs bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl text-slate-700 hover:text-indigo-900 transition-all text-left flex items-start space-x-2 shadow-2xs"
                >
                  <span className="text-indigo-500 font-bold">💬</span>
                  <span className="line-clamp-2">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.role !== 'user' && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1 text-indigo-700 font-medium">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Citas y fuentes incluidas</span>
                    </span>

                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      className="p-1 hover:text-slate-700 rounded transition-colors"
                      title="Copiar respuesta"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-500 shadow-xs flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 text-xs">Consultando páginas de los PDFs...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Haz una pregunta sobre tus documentos (Enter para enviar)..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-all resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-lg transition-colors ${
              input.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Respuestas fundamentadas exclusivamente en tus PDFs. La IA no utiliza conocimiento externo.
        </p>
      </div>
    </div>
  );
};
