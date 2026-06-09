import { useState } from 'react';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { SubFormProps } from './AssignmentFormModal.js';

export default function ExternalLinkAssignmentForm({
  url, description, estimatedMinutes,
  onUrlChange, onDescriptionChange, onEstimatedMinutesChange,
}: SubFormProps) {
  // Only show the URL error after the field has been touched (blurred at least once)
  const [urlTouched, setUrlTouched] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          id="reading-url"
          label="URL"
          type="url"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          onBlur={() => setUrlTouched(true)}
          placeholder="https://..."
          required
        />
        {urlTouched && !url.trim() && (
          <ErrorMessage variant="inline" message="URL is required" className="mt-1" />
        )}
      </div>
      <Textarea
        id="reading-description"
        label="Description (optional)"
        value={description}
        onChange={e => onDescriptionChange(e.target.value)}
        placeholder="Briefly describe what students should focus on..."
        rows={3}
      />
      <Input
        id="reading-minutes"
        label="Estimated reading time (minutes, optional)"
        type="number"
        value={estimatedMinutes}
        onChange={e => onEstimatedMinutesChange(e.target.value)}
        placeholder="e.g. 10"
        min={1}
      />
    </div>
  );
}
