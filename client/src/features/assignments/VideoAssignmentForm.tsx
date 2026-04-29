import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Input from '../../components/Input.js';
import { apiClient } from '../../api/client.js';

const youtubeUrlRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;

interface VideoAssignmentFormProps {
  url: string;
  displayTitle: string;
  onUrlChange: (url: string) => void;
  onDisplayTitleChange: (title: string) => void;
}

export default function VideoAssignmentForm({
  url, displayTitle, onUrlChange, onDisplayTitleChange,
}: VideoAssignmentFormProps) {
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const titleTouched = useRef(!!displayTitle);

  async function handleUrlBlur() {
    const trimmed = url.trim();
    if (!trimmed || !youtubeUrlRegex.test(trimmed) || titleTouched.current) return;
    setFetchingTitle(true);
    try {
      const { title: fetched } = await apiClient.get<{ title: string }>(
        `/youtube/title?url=${encodeURIComponent(trimmed)}`,
      );
      if (fetched && !titleTouched.current) onDisplayTitleChange(fetched);
    } catch {
      // Silently ignore — user can type the title manually
    } finally {
      setFetchingTitle(false);
    }
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
      {!url.trim() && (
        <p role="alert" className="text-sm text-destructive -mt-2">URL is required</p>
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
