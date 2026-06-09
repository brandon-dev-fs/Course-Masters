import { ReactNode, useEffect, useRef } from 'react';
import Button from './Button.js';

interface ModalProps {
	title: string;
	onClose: () => void;
	children: ReactNode;
	size?: 'md' | 'lg' | 'xl';
}

export default function Modal({
	title,
	onClose,
	children,
	size = 'md',
}: ModalProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Capture the trigger element exactly once at mount (before focus moves into the modal),
	// and restore focus to it on unmount. Kept separate from the keydown effect so that
	// inline arrow-function onClose props on call sites don't cause this to re-run and
	// overwrite previousFocusRef with the already-focused modal container.
	useEffect(() => {
		const trigger = document.activeElement;
		return () => {
			(trigger as HTMLElement | null)?.focus?.();
		};
	}, []);

	// Keyboard listener re-subscribes whenever onClose changes identity.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
		};
	}, [onClose]);

	// Move focus into the modal container on mount
	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				ref={containerRef}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				className={`relative flex flex-col max-h-[85vh] z-10 w-full ${size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-xl' : 'max-w-md'} rounded-2xl bg-surface-raised border border-border shadow-warm-lg mx-4 outline-none`}
			>
				<div className="flex items-center justify-between px-7 pt-7 pb-4 shrink-0">
					<h2 id="modal-title" className="text-lg font-semibold text-foreground">
						{title}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						aria-label="Close"
					>
						✕
					</Button>
				</div>
				<div className="flex flex-col flex-1 min-h-0 overflow-hidden px-7 pb-7">
					{children}
				</div>
			</div>
		</div>
	);
}
