'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentManager } from '@/components/DocumentManager';
import { ChatTab } from '@/components/ChatTab';
import { ExamTab } from '@/components/ExamTab';
import { FlashcardsTab } from '@/components/FlashcardsTab';
import { SettingsModal } from '@/components/SettingsModal';
import { 
  UploadedPDF, ChatMessage, ExamQuestion, ExamConfig, Flashcard, AppSettings 
} from '@/types';
import { 
  getStoredDocuments, saveDocument, deleteDocument, clearAllDocuments,
  getStoredChats, saveChatMessages, clearChats,
  getStoredFlashcards, saveFlashcards,
  getAppSettings, saveAppSettings 
} from '@/lib/storage';
import { buildContextSnippet } from '@/lib/pdfParser';
import { KeyRound, ShieldAlert, Sparkles } from 'lucide-react';

export default function Home() {
  const [documents, setDocuments] = useState<UploadedPDF[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: '',
    model: 'gemini-2.5-flash',
  });
  
  const [activeTab, setActiveTab] = useState<'documents' | 'chat' | 'exam' | 'flashcards'>('documents');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB and LocalStorage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [docs, chats, cards] = await Promise.all([
          getStoredDocuments(),
          getStoredChats(),
          getStoredFlashcards(),
        ]);
        setDocuments(docs);
        setMessages(chats);
        setFlashcards(cards);
        setSettings(getAppSettings());
      } catch (err) {
        console.error('Error cargando datos locales:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Document actions
  const handleAddDocument = async (doc: UploadedPDF) => {
    setDocuments((prev) => [...prev, doc]);
    await saveDocument(doc);
  };

  const handleRemoveDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    await deleteDocument(id);
  };

  const handleClearAllDocuments = async () => {
    if (window.confirm('¿Seguro que deseas eliminar todos los documentos subidos?')) {
      setDocuments([]);
      await clearAllDocuments();
    }
  };

  // Chat actions
  const handleSendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsChatLoading(true);

    try {
      const { text: contextSnippet } = buildContextSnippet(documents);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: contextSnippet,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          apiKey: settings.geminiApiKey || undefined,
          model: settings.model,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setIsSettingsOpen(true);
        }
        throw new Error(data.error || 'Error al obtener respuesta de la IA');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      await saveChatMessages(finalMessages);
    } catch (err: any) {
      console.error('Error enviando mensaje:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `⚠️ ${err.message || 'Error de conexión con el servicio de IA.'}`,
        timestamp: Date.now(),
      };
      const finalWithErr = [...newMessages, errorMsg];
      setMessages(finalWithErr);
      await saveChatMessages(finalWithErr);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    await clearChats();
  };

  // Exam actions
  const handleGenerateExam = async (config: ExamConfig): Promise<ExamQuestion[]> => {
    const { text: contextSnippet } = buildContextSnippet(documents);

    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: contextSnippet,
        config,
        apiKey: settings.geminiApiKey || undefined,
        model: settings.model,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setIsSettingsOpen(true);
      }
      throw new Error(data.error || 'No se pudo generar el examen');
    }

    return data.questions;
  };

  const handleGradeShortAnswer = async (
    question: string,
    modelAnswer: string,
    userAnswer: string
  ) => {
    const res = await fetch('/api/grade-short-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        modelAnswer,
        userAnswer,
        apiKey: settings.geminiApiKey || undefined,
        model: settings.model,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al evaluar respuesta corta');
    }
    return data;
  };

  // Flashcards actions
  const handleGenerateFlashcards = async (count: number, topic?: string): Promise<Flashcard[]> => {
    const { text: contextSnippet } = buildContextSnippet(documents);

    const res = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: contextSnippet,
        count,
        topic,
        apiKey: settings.geminiApiKey || undefined,
        model: settings.model,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setIsSettingsOpen(true);
      }
      throw new Error(data.error || 'Error al generar tarjetas');
    }

    return data.flashcards;
  };

  const handleSaveFlashcards = async (cards: Flashcard[]) => {
    setFlashcards(cards);
    await saveFlashcards(cards);
  };

  // Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const handleResetAllData = async () => {
    setDocuments([]);
    setMessages([]);
    setFlashcards([]);
    await clearAllDocuments();
    await clearChats();
    if (typeof window !== 'undefined') {
      const db = await indexedDB.open('EstudioConPDFs_DB');
      db.onsuccess = () => {
        const tx = db.result.transaction(['documents', 'chats', 'exams', 'flashcards'], 'readwrite');
        tx.objectStore('documents').clear();
        tx.objectStore('chats').clear();
        tx.objectStore('exams').clear();
        tx.objectStore('flashcards').clear();
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'documents' && (
          <DocumentManager
            documents={documents}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            onClearAll={handleClearAllDocuments}
            onStartStudying={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            documents={documents}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isChatLoading}
            onOpenDocuments={() => setActiveTab('documents')}
          />
        )}

        {activeTab === 'exam' && (
          <ExamTab
            documents={documents}
            onGenerateExam={handleGenerateExam}
            onGradeShortAnswer={handleGradeShortAnswer}
            onOpenDocuments={() => setActiveTab('documents')}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsTab
            documents={documents}
            flashcards={flashcards}
            onGenerateFlashcards={handleGenerateFlashcards}
            onSaveFlashcards={handleSaveFlashcards}
            onOpenDocuments={() => setActiveTab('documents')}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}
