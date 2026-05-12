import { useState } from 'react';
import Input from '../../components/Input.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { SubFormProps } from './AssignmentFormModal.js';

export default function PracticeProblemMetaFields({ passingPercentage, onPassingPercentageChange }: SubFormProps) {
  const [touched, setTouched] = useState(false);
  const pct = Number(passingPercentage);
  const error = touched && passingPercentage !== '' && (pct < 0 || pct > 100)
    ? 'Must be between 0 and 100'
    : '';

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        Passing percentage <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <div className="flex items-center gap-2 mt-1">
        <Input
          type="number"
          min={0}
          max={100}
          value={passingPercentage}
          onChange={e => onPassingPercentageChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 80"
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">% — leave empty for manual completion</span>
      </div>
      {error && <ErrorMessage variant="inline" message={error} className="mt-1" />}
    </div>
  );
}
