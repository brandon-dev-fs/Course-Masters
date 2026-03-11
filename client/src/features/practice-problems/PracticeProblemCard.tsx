import { useState } from 'react';
import { Brain } from 'lucide-react';
import type { PracticeProblem } from '../../api/types.js';
import Button from '../../components/Button.js';

interface PracticeProblemCardProps {
  problem: PracticeProblem;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PracticeProblemCard({ problem, onEdit, onDelete }: PracticeProblemCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const isCorrect = checked && selected === problem.correctIndex;

  function handleCheck() {
    if (selected !== null) setChecked(true);
  }

  function handleReset() {
    setSelected(null);
    setChecked(false);
  }

  return (
    <div className="rounded-lg bg-surface border border-border p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          <Brain className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-foreground font-medium">{problem.question}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised">Edit</button>
          <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised">Delete</button>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {problem.options.map((option, i) => {
          let optionClass = 'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ';
          if (!checked) {
            optionClass += selected === i
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-surface-raised text-foreground hover:border-primary/50';
          } else if (i === problem.correctIndex) {
            optionClass += 'border-primary bg-primary-subtle text-primary';
          } else if (i === selected && selected !== problem.correctIndex) {
            optionClass += 'border-destructive bg-destructive/10 text-destructive';
          } else {
            optionClass += 'border-border bg-surface-raised text-muted-foreground';
          }

          return (
            <label key={i} className={optionClass}>
              <input
                type="radio"
                name={`practice-${problem.id}`}
                checked={selected === i}
                onChange={() => { if (!checked) setSelected(i); }}
                disabled={checked}
                className="accent-accent shrink-0"
              />
              <span>{option}</span>
              {checked && i === problem.correctIndex && <span className="ml-auto text-xs font-medium">✓ Correct</span>}
              {checked && i === selected && selected !== problem.correctIndex && <span className="ml-auto text-xs font-medium">✗ Your answer</span>}
            </label>
          );
        })}
      </div>

      {!checked ? (
        <Button size="sm" onClick={handleCheck} disabled={selected === null}>Check Answer</Button>
      ) : (
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground underline">Try again</button>
        </div>
      )}
    </div>
  );
}
