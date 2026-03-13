import { ReactNode, useEffect } from 'react';
import Button from './Button.js';

interface ModalProps {
	title: string;
	onClose: () => void;
	children: ReactNode;
	size?: 'md' | 'lg';
}

export default function Modal({
	title,
	onClose,
	children,
	size = 'md',
}: ModalProps) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className={`relative max-h-3/4 z-10 w-full ${size === 'lg' ? 'max-w-xl' : 'max-w-md'} rounded-2xl bg-surface-raised border border-border p-7 shadow-warm-lg mx-4`}
			>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-foreground">
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
				{children}
			</div>
		</div>
	);
}
