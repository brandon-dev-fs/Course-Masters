import { useState } from 'react';
import type { PracticeProblem } from '../../api/types.js';
import Button from '../../components/Button.js';

interface PracticeProblemCardProps {
  problem: PracticeProblem;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PracticeProblemCard({ problem, onEdit, onDelete }: PracticeProblemCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = checked && userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();

  function handleCheck() {
    if (userAnswer.trim()) setChecked(true);
  }

  function handleReset() {
    setUserAnswer('');
    setChecked(false);
    setRevealed(false);
  }

  return (
    <div className="rounded-lg bg-surface border border-border p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-lg shrink-0 mt-0.5">🧠</span>
          <p className="text-foreground font-medium">{problem.question}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised">Edit</button>
          <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised">Delete</button>
        </div>
      </div>

      {!checked ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCheck(); }}
            placeholder="Your answer..."
            className="flex-1 rounded-xl border-2 border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <Button size="sm" onClick={handleCheck} disabled={!userAnswer.trim()}>Check</Button>
        </div>
      ) : (
        <div className={`rounded-xl p-3 flex items-start justify-between gap-2 ${isCorrect ? 'bg-primary-subtle border border-primary/30' : 'bg-destructive/10 border border-destructive/30'}`}>
          <div>
            {isCorrect ? (
              <p className="text-primary text-sm font-medium">✓ Correct!</p>
            ) : (
              <div>
                <p className="text-destructive text-sm">✗ Incorrect. Your answer: <span className="italic">{userAnswer}</span></p>
                {revealed ? (
                  <p className="text-foreground text-sm mt-1">Answer: <span className="font-medium text-accent">{problem.answer}</span></p>
                ) : (
                  <button onClick={() => setRevealed(true)} className="text-xs text-muted-foreground hover:text-foreground mt-1 underline">Reveal answer</button>
                )}
              </div>
            )}
          </div>
          <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Try again</button>
        </div>
      )}
    </div>
  );
}
