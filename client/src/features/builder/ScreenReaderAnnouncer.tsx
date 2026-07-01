interface ScreenReaderAnnouncerProps {
  message: string;
}

export default function ScreenReaderAnnouncer({ message }: ScreenReaderAnnouncerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
