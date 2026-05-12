import { Play } from 'lucide-react';
import type { LessonResource } from '../../api/types.js';
import { getEmbedUrl } from '../../utils/youtube.js';
import CardActions from '../../components/CardActions.js';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';

interface VideoCardProps {
  video: LessonResource;
  onEdit?: () => void;
  onDelete?: () => void;
  isComplete?: boolean;
  onToggleComplete?: () => void;
}

export default function VideoCard({ video, onEdit, onDelete, isComplete, onToggleComplete }: VideoCardProps) {
  if (video.type !== 'video') {
    return <p className="text-sm text-muted-foreground">Unsupported resource type.</p>;
  }
  const url = video.content.url;
  const embedUrl = url ? getEmbedUrl(url) : null;

  return (
    <div className="rounded-lg bg-surface border border-border p-4 group shadow-warm-sm hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-accent shrink-0" />
          <p className="text-foreground font-semibold text-sm">{video.title}</p>
        </div>
        {onEdit && onDelete && <CardActions onEdit={onEdit} onDelete={onDelete} />}
      </div>
      {embedUrl && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-md"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {onToggleComplete && isComplete !== undefined && (
        <div className="pt-3 mt-3 border-t border-border">
          <ResourceCompletionCheckbox isComplete={isComplete} onToggle={onToggleComplete} />
        </div>
      )}
    </div>
  );
}
