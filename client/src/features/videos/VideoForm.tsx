import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import type { LessonResource } from '../../api/types.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';
import useYouTubeTitle from '../../hooks/useYouTubeTitle.js';

interface VideoFormProps {
  initial?: LessonResource;
  nextOrder?: number;
  onSubmit: (data: { title: string; url: string; order: number }) => Promise<void>;
  onCancel: () => void;
}

export default function VideoForm({ initial, nextOrder = 1, onSubmit, onCancel }: VideoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState((initial?.content?.url as string) ?? '');
  const [order, setOrder] = useState(initial?.order ?? nextOrder);
  const titleTouched = useRef(!!initial?.title);

  const onTitleFetched = useCallback((fetched: string) => {
    setTitle(fetched);
  }, []);

  const { fetchingTitle, handleUrlBlur } = useYouTubeTitle({ url, titleTouched, onTitleFetched });

  const { error, submitting, handleSubmit } = useFormSubmit(async () => {
    if (!title.trim()) throw new Error('Title is required');
    if (!url.trim()) throw new Error('YouTube URL is required');
    await onSubmit({ title: title.trim(), url: url.trim(), order });
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="url" label="YouTube URL" value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur} placeholder="https://www.youtube.com/watch?v=..." autoFocus />
      <div className="relative">
        <Input
          id="title"
          label="Title"
          value={title}
          onChange={e => { setTitle(e.target.value); titleTouched.current = true; }}
          placeholder={fetchingTitle ? 'Fetching title...' : 'e.g. Introduction to Variables'}
          disabled={fetchingTitle}
        />
        {fetchingTitle && (
          <Loader2 className="absolute right-3 top-9 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>
      <Input id="order" label="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={1} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting || fetchingTitle}>{submitting ? 'Saving...' : initial?.id ? 'Save Changes' : 'Add Video'}</Button>
      </div>
    </form>
  );
}
