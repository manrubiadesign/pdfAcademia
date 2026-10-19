'use client';

import React from 'react';
import { BookOpen, MessageSquare, GraduationCap, Layers, Settings, FileText } from 'lucide-react';
import { UploadedPDF } from '@/types';

interface NavbarProps {
  activeTab: 'documents' | 'chat' | 'exam' | 'flashcards';
  setActiveTab: (tab: 'documents' | 'chat' | 'exam' | 'flashcards') => void;
  documents: UploadedPDF[];
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  documents,
  onOpenSettings,
}) => {
  const totalPages = documents.reduce((acc, d) => acc + d.totalPages, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Estudio con PDFs</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                  IA Rigurosa
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Chat, exámenes y tarjetas de estudio fundamentados en tus documentos
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documentos</span>
              {documents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-indigo-600 text-white font-bold">
                  {documents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Preguntas</span>
            </button>

            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'exam'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Examen</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tarjetas</span>
            </button>
          </nav>

          {/* Right Action: Settings */}
          <div className="flex items-center space-x-2">
            {documents.length > 0 && (
              <div className="hidden lg:flex items-center text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                <span>{documents.length} PDF{documents.length > 1 ? 's' : ''} ({totalPages} págs.)</span>
              </div>
            )}
            <button
              onClick={onOpenSettings}
              title="Ajustes y clave de API"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
