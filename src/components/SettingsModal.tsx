'use client';

import React, { useState } from 'react';
import { X, Key, Cpu, Trash2, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { AppSettings } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetAllData,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [model, setModel] = useState(settings.model || 'gemini-2.5-flash');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      geminiApiKey: apiKey.trim(),
      model,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleConfirmReset = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todos los PDFs, chats y exámenes guardados? Esta acción es irreversible.')) {
      onResetAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Ajustes de la aplicación</h3>
              <p className="text-xs text-slate-500">Configuración de IA y privacidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center space-x-0.5"
              >
                <span>Obtener clave gratis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Opcional si ya has configurado <code>GEMINI_API_KEY</code> en tu archivo <code>.env.local</code>. Se guarda de forma privada en tu navegador.
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Modelo de Inteligencia Artificial
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Rápido y Estable)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Alta Inteligencia)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Rendimiento Avanzado)</option>
                <option value="gemini-3.1-pro">Gemini 3.1 Pro (Razonamiento Complejo)</option>
              </select>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Tus PDFs y preguntas se procesan de forma privada y no se utilizan para entrenar modelos.</span>
          </div>

          {/* Danger zone: reset */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleConfirmReset}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar todos los datos locales</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center space-x-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar ajustes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
