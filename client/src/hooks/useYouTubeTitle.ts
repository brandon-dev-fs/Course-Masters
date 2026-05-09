import { useCallback, useState } from 'react';
import { apiClient } from '../api/client.js';
import { youtubeUrlRegex } from '../utils/youtube.js';

interface UseYouTubeTitleOptions {
  url: string;
  titleTouched: React.RefObject<boolean>;
  onTitleFetched: (title: string) => void;
}

interface UseYouTubeTitleResult {
  fetchingTitle: boolean;
  handleUrlBlur: () => Promise<void>;
}

export default function useYouTubeTitle({
  url,
  titleTouched,
  onTitleFetched,
}: UseYouTubeTitleOptions): UseYouTubeTitleResult {
  const [fetchingTitle, setFetchingTitle] = useState(false);

  const handleUrlBlur = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed || !youtubeUrlRegex.test(trimmed) || titleTouched.current) return;
    setFetchingTitle(true);
    try {
      const { title } = await apiClient.get<{ title: string }>(
        `/youtube/title?url=${encodeURIComponent(trimmed)}`,
      );
      if (title && !titleTouched.current) onTitleFetched(title);
    } catch {
      // Silently ignore — user can type the title manually
    } finally {
      setFetchingTitle(false);
    }
  }, [url, titleTouched, onTitleFetched]);

  return { fetchingTitle, handleUrlBlur };
}
