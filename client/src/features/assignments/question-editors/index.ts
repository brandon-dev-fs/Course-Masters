import type React from 'react';

export interface QuestionTypeEditorProps {
  content: Record<string, unknown>;
  /** The index of this question within the list (used for unique input name attributes) */
  index: number;
  onChange: (content: Record<string, unknown>) => void;
}

export type QuestionTypeEditor = React.ComponentType<QuestionTypeEditorProps>;

export { default as MultipleChoiceEditor } from './MultipleChoiceEditor.js';
export { default as TrueFalseEditor } from './TrueFalseEditor.js';
export { default as MatchingEditor } from './MatchingEditor.js';
export { default as FillInBlankEditor } from './FillInBlankEditor.js';
