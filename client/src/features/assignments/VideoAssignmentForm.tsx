import { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Input from '../../components/Input.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import type { SubFormProps } from './AssignmentFormModal.js';
import useYouTubeTitle from '../../hooks/useYouTubeTitle.js';

export default function VideoAssignmentForm({
  url, displayTitle, onUrlChange, onDisplayTitleChange,
}: SubFormProps) {
  const [urlTouched, setUrlTouched] = useState(false);
  const titleTouched = useRef(!!displayTitle);

  const onTitleFetched = useCallback((fetched: string) => {
    onDisplayTitleChange(fetched);
  }, [onDisplayTitleChange]);

  const { fetchingTitle, handleUrlBlur: handleYouTubeUrlBlur } = useYouTubeTitle({
    url,
    titleTouched,
    onTitleFetched,
  });

  async function handleUrlBlur() {
    setUrlTouched(true);
    await handleYouTubeUrlBlur();
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="video-url"
        label="YouTube URL"
        value={url}
        onChange={e => onUrlChange(e.target.value)}
        onBlur={handleUrlBlur}
        placeholder="https://www.youtube.com/watch?v=..."
        required
      />
      {urlTouched && !url.trim() && (
        <ErrorMessage variant="inline" message="URL is required" className="-mt-2" />
      )}
      <div className="relative">
        <Input
          id="video-display-title"
          label="Display title"
          value={displayTitle}
          onChange={e => {
            titleTouched.current = true;
            onDisplayTitleChange(e.target.value);
          }}
          placeholder={fetchingTitle ? 'Fetching title...' : 'e.g. Introduction to Variables'}
          disabled={fetchingTitle}
        />
        {fetchingTitle && (
          <Loader2 className="absolute right-3 top-9 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>
    </div>
  );
}
