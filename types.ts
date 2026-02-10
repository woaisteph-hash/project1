export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SIMULATOR_8086 = 'SIMULATOR_8086',
  INTERFACE_LAB = 'INTERFACE_LAB',
  AI_TUTOR = 'AI_TUTOR',
  SYLLABUS = 'SYLLABUS',
  EXAM_GENERATOR = 'EXAM_GENERATOR', // New view
}

export interface RegisterState {
  AX: string;
  BX: string;
  CX: string;
  DX: string;
  SI: string;
  DI: string;
  SP: string;
  BP: string;
  IP: string;
  FLAGS: string;
  CS: string;
  DS: string;
  SS: string;
  ES: string;
}

export interface SimulationResult {
  registers: RegisterState;
  memoryChanges: Array<{ address: string; value: string }>;
  explanation: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface InterfaceConfig8255 {
  portA: number; // 0-255 (8 bits)
  portB: number;
  portC: number;
  controlWord: number;
  mode: 'input' | 'output'; // Simplified for simulation
}

export interface TopicCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface SyllabusNode {
  id: string;
  title: string;
  children?: SyllabusNode[];
  queryPrompt?: string; // Prompt to ask AI when clicked
}

export interface ExamQuestion {
  type: 'CHOICE' | 'SHORT_ANSWER' | 'CODING' | 'READING';
  content: string;
  options?: string[]; // For CHOICE
  correctAnswer: string;
  explanation: string;
}