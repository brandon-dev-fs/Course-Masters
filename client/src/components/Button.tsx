import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-primary hover:brightness-110 text-primary-foreground shadow-warm-sm',
  secondary: 'bg-surface hover:bg-surface-raised text-foreground border border-border shadow-warm-sm',
  danger: 'bg-destructive hover:brightness-110 text-destructive-foreground shadow-warm-sm',
  ghost: 'bg-transparent hover:bg-surface text-muted-foreground hover:text-foreground',
  accent: 'bg-accent hover:brightness-110 text-accent-foreground shadow-warm-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}
