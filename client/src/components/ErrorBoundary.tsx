import React from 'react';
import Button from './Button.js';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  reset(): void {
    this.setState({ error: null });
  }

  render(): React.ReactNode {
    const { error } = this.state;

    if (error !== null) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="rounded-lg bg-surface border border-border p-4 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Something went wrong.</p>
          <div>
            <Button variant="secondary" size="sm" onClick={this.reset}>
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
