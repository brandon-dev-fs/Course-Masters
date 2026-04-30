import { getEmbedUrl } from '../../utils/youtube.js';

interface VideoAssignmentViewProps {
  url: string;
  title?: string | null;
}

export default function VideoAssignmentView({ url, title }: VideoAssignmentViewProps) {
  const embedUrl = getEmbedUrl(url);

  return (
    <div className="flex flex-col gap-3">
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-md"
            src={embedUrl}
            title={title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Unable to embed this video URL.</p>
      )}
      {title && (
        <p className="text-sm text-muted-foreground">{title}</p>
      )}
    </div>
  );
}
