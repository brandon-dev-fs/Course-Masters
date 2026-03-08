import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button.js';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-surface border border-border shadow-warm-sm mb-4 text-muted-foreground">
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      <p className="text-lg font-bold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
