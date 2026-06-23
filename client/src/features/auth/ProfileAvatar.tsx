interface ProfileAvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileAvatar({ name, size = 'md' }: ProfileAvatarProps) {
  const sizeClass = size === 'md' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} bg-green-surface border-2 border-green-primary text-green-surface-text font-bold rounded-full flex items-center justify-center shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
