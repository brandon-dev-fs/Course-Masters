import { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, UserCircle, ShieldCheck, LogOut, Globe } from 'lucide-react';

import { useAuth } from '../context/AuthContext.js';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  focusReturnRef: React.RefObject<HTMLButtonElement | null>;
}

function drawerLinkClass(active: boolean): string {
  return active
    ? 'flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl bg-green-surface text-green-surface-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2'
    : 'flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl text-text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2';
}

export default function MobileDrawer({ isOpen, onClose, focusReturnRef }: MobileDrawerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  function isActive(path: string): boolean {
    return location.pathname === path;
  }

  // Move focus into drawer when it opens; return focus to hamburger on close.
  // wasOpenRef guards the else branch so it only fires after a real open/close cycle,
  // not on initial mount when isOpen is already false.
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      requestAnimationFrame(() => closeBtnRef.current?.focus());
    } else if (wasOpenRef.current) {
      focusReturnRef.current?.focus();
    }
  }, [isOpen, focusReturnRef]);

  // Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap — Tab and Shift+Tab cycle within focusable elements
  function handleKeyDownOnDrawer(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !drawerRef.current) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusable = Array.from(
      drawerRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  async function handleSignOut() {
    onClose();
    await logout();
    navigate('/');
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={handleKeyDownOnDrawer}
        className="fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-background border-l border-border shadow-warm-lg flex flex-col z-[60] animate-slide-in-right"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="font-semibold text-primary">Course Masters</span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close navigation menu"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer body — nav items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
          {!user && (
            <>
              <Link
                to="/login"
                onClick={onClose}
                aria-current={isActive('/login') ? 'page' : undefined}
                className={drawerLinkClass(isActive('/login'))}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                aria-current={isActive('/register') ? 'page' : undefined}
                className="flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl bg-green-button text-green-button-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 hover:brightness-110"
              >
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              <Link
                to="/profile"
                onClick={onClose}
                aria-current={isActive('/profile') ? 'page' : undefined}
                className={drawerLinkClass(isActive('/profile'))}
              >
                <UserCircle className="w-4 h-4 shrink-0" />
                {user.name}
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin/users"
                    onClick={onClose}
                    aria-current={isActive('/admin/users') ? 'page' : undefined}
                    className={drawerLinkClass(isActive('/admin/users'))}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Admin
                  </Link>
                  <Link
                    to="/admin/trusted-sources"
                    onClick={onClose}
                    aria-current={isActive('/admin/trusted-sources') ? 'page' : undefined}
                    className={drawerLinkClass(isActive('/admin/trusted-sources'))}
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    Sources
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Drawer footer — sign out */}
        {user && (
          <div className="border-t border-border px-4 py-4">
            <button
              onClick={() => void handleSignOut()}
              className="flex items-center min-h-[44px] px-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
