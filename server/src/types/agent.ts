export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

export interface ConversationLog {
  messages: ConversationMessage[];
  summary: string;
}

export type AgentPhase = 'pre_load' | 'elicitation' | 'outline' | 'curation' | 'build' | 'summary';

export const PHASE_SEQUENCE: AgentPhase[] = [
  'pre_load',
  'elicitation',
  'outline',
  'curation',
  'build',
  'summary',
];

export const MESSAGE_ACCEPTING_PHASES: AgentPhase[] = [
  'pre_load',
  'elicitation',
  'outline',
  'curation',
];

export const MAX_CONVERSATION_WINDOW = 20;
