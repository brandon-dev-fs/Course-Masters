import Textarea from '../../../components/Textarea.js';
import type { QuestionTypeEditorProps } from './index.js';

export default function TrueFalseEditor({ content, index, onChange }: QuestionTypeEditorProps) {
  const idx = index ?? 0;
  const question = (content.question as string) ?? '';
  const correct = (content.correct as boolean) ?? true;

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Question"
        value={question}
        onChange={e => onChange({ ...content, question: e.target.value })}
        placeholder="Is it true that...?"
        rows={2}
      />
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Correct answer</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`tf-correct-${idx}`}
              checked={correct === true}
              onChange={() => onChange({ ...content, correct: true })}
              className="accent-accent"
            />
            <span className="text-sm text-foreground">True</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`tf-correct-${idx}`}
              checked={correct === false}
              onChange={() => onChange({ ...content, correct: false })}
              className="accent-accent"
            />
            <span className="text-sm text-foreground">False</span>
          </label>
        </div>
      </div>
    </div>
  );
}
