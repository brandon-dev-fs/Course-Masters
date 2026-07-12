import { useState } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

import Input from '../../components/Input.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { linkApi } from '../../api/link.js';
import type { SubFormProps } from './AssignmentFormModal.js';

type EmbedStatus = 'idle' | 'loading' | 'can' | 'cannot';

export default function ExternalLinkAssignmentForm({
  url, estimatedMinutes,
  onUrlChange, onEstimatedMinutesChange,
}: SubFormProps) {
  const [urlTouched, setUrlTouched] = useState(false);
  const [embedStatus, setEmbedStatus] = useState<EmbedStatus>('idle');

  async function handleUrlBlur() {
    setUrlTouched(true);
    if (!url.trim()) return;

    setEmbedStatus('loading');
    try {
      const { canEmbed } = await linkApi.checkEmbed(url.trim());
      setEmbedStatus(canEmbed ? 'can' : 'cannot');
    } catch {
      setEmbedStatus('idle');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          id="reading-url"
          label="URL"
          type="url"
          value={url}
          onChange={e => {
            onUrlChange(e.target.value);
            setEmbedStatus('idle');
          }}
          onBlur={handleUrlBlur}
          placeholder="https://..."
          required
        />
        {urlTouched && !url.trim() && (
          <ErrorMessage variant="inline" message="URL is required" className="mt-1" />
        )}
        {embedStatus === 'loading' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking embeddability…
          </p>
        )}
        {embedStatus === 'can' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-green-surface-text">
            <CheckCircle className="w-3 h-3" />
            Can be embedded
          </p>
        )}
        {embedStatus === 'cannot' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-orange-surface-text">
            <AlertTriangle className="w-3 h-3" />
            Cannot embed — students will see an "Open in new tab" button
          </p>
        )}
      </div>
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
