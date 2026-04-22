import { useRef, useState } from 'react';
import { Brain } from 'lucide-react';
import type { LessonTool } from '../../api/types.js';
import Button from '../../components/Button.js';
import CardActions from '../../components/CardActions.js';
import CalculatorPanel from '../assessments/CalculatorPanel.js';

interface PracticeProblemCardProps {
  problem: LessonTool;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PracticeProblemCard({ problem, onEdit, onDelete }: PracticeProblemCardProps) {
  const question = (problem.content.question as string) ?? problem.title;
  const options = (problem.content.options as string[]) ?? [];
  const correctIndex = (problem.content.correctIndex as number) ?? 0;
  const calculatorEnabled = (problem.content.calculatorEnabled as boolean) ?? false;

  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const calcTriggerRef = useRef<HTMLButtonElement>(null);

  const isCorrect = checked && selected === correctIndex;

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
          <p className="text-foreground font-medium">{question}</p>
        </div>
        {onEdit && onDelete && <CardActions onEdit={onEdit} onDelete={onDelete} />}
      </div>

      {calculatorEnabled && (
        <>
          <button
            ref={calcTriggerRef}
            type="button"
            aria-expanded={isCalculatorOpen}
            aria-controls={`calculator-panel-${problem.id}`}
            aria-label={isCalculatorOpen ? 'Close calculator' : 'Open calculator'}
            onClick={() => setIsCalculatorOpen(prev => !prev)}
            className="inline-flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-surface hover:bg-surface-raised text-foreground border border-border shadow-warm-sm px-3 py-1.5 text-sm rounded-xl self-start w-full sm:w-auto min-h-[44px] sm:min-h-0 mb-2"
          >
            🧮 {isCalculatorOpen ? 'Close calculator' : 'Calculator'}
          </button>
          {isCalculatorOpen && (
            <CalculatorPanel onClose={() => setIsCalculatorOpen(false)} triggerRef={calcTriggerRef} panelId={`calculator-panel-${problem.id}`} />
          )}
        </>
      )}

      <div className="flex flex-col gap-2 mb-3">
        {options.map((option, i) => {
          let optionClass = 'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ';
          if (!checked) {
            optionClass += selected === i
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-surface-raised text-foreground hover:border-primary/50';
          } else if (i === correctIndex) {
            optionClass += 'border-primary bg-primary-subtle text-primary';
          } else if (i === selected && selected !== correctIndex) {
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
              {checked && i === correctIndex && <span className="ml-auto text-xs font-medium">✓ Correct</span>}
              {checked && i === selected && selected !== correctIndex && <span className="ml-auto text-xs font-medium">✗ Your answer</span>}
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
