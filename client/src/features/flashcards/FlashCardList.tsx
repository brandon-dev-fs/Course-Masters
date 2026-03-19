import { useEffect, useState } from 'react';
import { flashCardsApi } from '../../api/flashcards.js';
import type { FlashCard } from '../../api/types.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import FlashCardForm from './FlashCardForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function FlashCardList({ lessonId }: { lessonId: string }) {
	const [cards, setCards] = useState<FlashCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAdd, setShowAdd] = useState(false);
	const [deleting, setDeleting] = useState<FlashCard | null>(null);
	const [studying, setStudying] = useState(false);
	const [editMode, setEditMode] = useState(false);

	useEffect(() => {
		flashCardsApi
			.getAll(lessonId)
			.then(setCards)
			.catch((err: unknown) =>
				setError(
					err instanceof Error
						? err.message
						: 'Failed to load flash cards',
				),
			)
			.finally(() => setLoading(false));
	}, [lessonId]);

	async function handleAdd(data: {
		front: string;
		back: string;
		order: number;
	}) {
		const card = await flashCardsApi.create(lessonId, data);
		setCards((prev) => [...prev, card].sort((a, b) => a.order - b.order));
		setShowAdd(false);
	}

	async function handleUpdate(
		id: string,
		data: { front?: string; back?: string },
	) {
		const updated = await flashCardsApi.update(id, data);
		setCards((prev) =>
			prev
				.map((c) => (c.id === updated.id ? updated : c))
				.sort((a, b) => a.order - b.order),
		);
	}

	async function handleDelete() {
		if (!deleting) return;
		await flashCardsApi.delete(deleting.id);
		setCards((prev) => prev.filter((c) => c.id !== deleting.id));
		setDeleting(null);
	}

	function handleToggleEdit() {
		setEditMode((prev) => !prev);
		setStudying(false);
	}

	function handleStudyMode() {
		setStudying(true);
		setEditMode(false);
	}

	if (loading) return <LoadingSpinner />;
	if (error) return <ErrorMessage message={error} />;

	return (
		<div>
			<div className="flex items-center gap-2 justify-end mb-4">
				{cards.length > 0 && (
					<>
						<Button
							variant="accent"
							size="sm"
							onClick={handleStudyMode}
						>
							Study Mode
						</Button>
						<span className="w-px h-4 bg-border" />
						<Button
							size="sm"
							onClick={() => setShowAdd(true)}
						>
							+ Add Card
						</Button>

						<Button
							variant={editMode ? 'danger' : 'secondary'}
							size="sm"
							onClick={handleToggleEdit}
						>
							{editMode ? 'Done Editing' : 'Edit Cards'}
						</Button>
					</>
				)}
				{cards.length === 0 && (
					<Button
						size="sm"
						onClick={() => setShowAdd(true)}
					>
						+ Add Card
					</Button>
				)}
			</div>

			{cards.length === 0 ? (
				<EmptyState
					title="No flash cards yet"
					description="Create flash cards to study key concepts."
					action={{
						label: '+ Add Card',
						onClick: () => setShowAdd(true),
					}}
				/>
			) : (
				<div
					className={
						editMode
							? 'grid grid-cols-1 gap-4'
							: 'grid grid-cols-1 sm:grid-cols-2 gap-4'
					}
				>
					{cards.map((card) => (
						<FlashCardComponent
							key={card.id}
							card={card}
							editMode={editMode}
							onUpdate={handleUpdate}
							onDelete={() => setDeleting(card)}
						/>
					))}
				</div>
			)}

			{studying && (
				<FlashCardStudyMode
					cards={cards}
					onExit={() => setStudying(false)}
				/>
			)}

			{showAdd && (
				<Modal
					title="Add Flash Card"
					onClose={() => setShowAdd(false)}
				>
					<FlashCardForm
						nextOrder={cards.length + 1}
						onSubmit={handleAdd}
						onCancel={() => setShowAdd(false)}
					/>
				</Modal>
			)}
			{deleting && (
				<ConfirmDialog
					title="Delete Card"
					message="Delete this flash card?"
					onConfirm={handleDelete}
					onClose={() => setDeleting(null)}
				/>
			)}
		</div>
	);
}
