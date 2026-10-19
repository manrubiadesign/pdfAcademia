export interface PDFPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface UploadedPDF {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  pages: PDFPage[];
  totalChars: number;
  isScanned: boolean; // true if very little or no selectable text detected
  uploadDate: number;
}

export interface Citation {
  docName: string;
  page: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: number;
}

export type QuestionType = 'test' | 'boolean' | 'short';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // 4 options for test
  correctAnswer: string; // "A"|"B"|"C"|"D" or "Verdadero"|"Falso" or model text
  explanation: string;
  sourceDoc: string;
  sourcePage: number;
  userAnswer?: string;
  isCorrect?: boolean;
  score?: 'correct' | 'partial' | 'incorrect';
  aiFeedback?: string; // Feedback from AI for short answers
}

export interface ExamConfig {
  type: 'test' | 'boolean' | 'short' | 'mixed';
  count: number; // 5 to 15
  difficulty: 'facil' | 'media' | 'dificil';
  topic: string;
}

export interface ExamState {
  id: string;
  config: ExamConfig;
  questions: ExamQuestion[];
  isSubmitted: boolean;
  createdAt: number;
  score?: number;
  totalAnswered?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceDoc: string;
  sourcePage: number;
  mastered?: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  model: string;
}
