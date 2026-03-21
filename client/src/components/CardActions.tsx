interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardActions({ onEdit, onDelete }: CardActionsProps) {
  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised">Edit</button>
      <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised">Delete</button>
    </div>
  );
}
