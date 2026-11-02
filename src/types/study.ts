export enum AppTab {
  Planner = 'planner',
  DoubtSolver = 'doubts',
  Quiz = 'quiz',
}

export type SubjectName = 'Chemistry' | 'Communication Skills' | 'PSC';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface DoubtItem {
  question: string;
  answer: string;
}

export interface SubjectCourseData {
  subject: SubjectName;
  unit: number;
  quiz: QuizQuestion[];
  doubts: DoubtItem[];
}

export interface SubjectMeta {
  id: SubjectName;
  shortLabel: string;
  fullLabel: string;
  subtitle: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  barColor: string;
}

export interface SubjectPlanConfig {
  subject: SubjectName;
  selected: boolean;
  examDate: string;
}

export interface StudyTask {
  id: string;
  dayIndex: number;
  dateLabel: string;
  isoDate: string;
  subject: SubjectName;
  title: string;
  durationHours: number;
  completed: boolean;
}

export interface UploadedNote {
  id: string;
  title: string;
  subject: SubjectName | 'General';
  content: string;
  uploadDate: string;
  sourceType: 'file' | 'pasted' | 'preset';
  wordCount: number;
}

export type DoubtMode = 'chat' | 'voice';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export type QuizMode = 'syllabus' | 'custom_notes';
