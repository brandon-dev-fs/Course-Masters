import { useEffect, useRef } from 'react';

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onClose: () => void;
  ariaLabel: string;
  align?: 'left' | 'right';
}

export default function DropdownMenu({
  items,
  onClose,
  ariaLabel,
  align = 'right',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Focus the first menu item on mount
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
    firstItem?.focus();
  }, []);

  function handleKeyDownMenu(e: React.KeyboardEvent<HTMLDivElement>) {
    const menuItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [],
    );
    const current = document.activeElement;
    const idx = menuItems.indexOf(current as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      menuItems[(idx + 1) % menuItems.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      menuItems[(idx - 1 + menuItems.length) % menuItems.length]?.focus();
    }
  }

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={`absolute ${alignClass} mt-1 w-44 bg-surface-raised border border-border rounded-xl shadow-warm-md z-30 py-1`}
      onKeyDown={handleKeyDownMenu}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.dividerBefore && (
            <div className="my-1 border-t border-border-subtle mx-1" role="separator" />
          )}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left rounded-lg mx-1 cursor-pointer transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${item.variant === 'destructive'
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-text-primary hover:bg-surface'
              }`}
            style={{ width: 'calc(100% - 0.5rem)' }}
          >
            {item.icon && (
              <span className="w-4 h-4 shrink-0" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
