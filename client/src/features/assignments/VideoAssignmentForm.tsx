import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Input from '../../components/Input.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { SubFormProps } from './AssignmentFormModal.js';

export default function VideoAssignmentForm({
  url, onUrlChange, fetchingVideoTitle, handleVideoUrlBlur,
}: SubFormProps) {
  const [urlTouched, setUrlTouched] = useState(false);

  async function handleUrlBlur() {
    setUrlTouched(true);
    await handleVideoUrlBlur();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Input
          id="video-url"
          label="YouTube URL"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          disabled={fetchingVideoTitle}
        />
        {fetchingVideoTitle && (
          <Loader2 className="absolute right-3 top-9 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>
      {urlTouched && !url.trim() && (
        <ErrorMessage variant="inline" message="URL is required" className="-mt-2" />
      )}
      {fetchingVideoTitle && (
        <p className="text-xs text-muted-foreground -mt-2">Fetching video title…</p>
      )}
    </div>
  );
}
