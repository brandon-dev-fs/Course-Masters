import { ExternalLink } from 'lucide-react';

interface ReadingAssignmentViewProps {
  url: string;
  description?: string | null;
  estimatedMinutes?: number | null;
}

export default function ReadingAssignmentView({ url, description, estimatedMinutes }: ReadingAssignmentViewProps) {
  return (
    <div className="rounded-xl border border-border bg-accent-subtle px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-accent font-medium hover:underline"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {url}
          <span className="sr-only">(opens in new tab)</span>
        </a>
        {estimatedMinutes != null && (
          <span className="text-xs text-muted-foreground">~ {estimatedMinutes} min read</span>
        )}
      </div>
      {description && (
        <p className="text-sm text-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
