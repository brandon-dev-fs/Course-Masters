import { useState } from 'react';
import type { Course, Unit } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import UnitForm from './UnitForm.js';

interface UnitSettingsModalProps {
	course: Course;
	onClose: () => void;
	onAddUnit: (data: { title: string; order: number }) => Promise<void>;
	onUpdateUnit: (
		unit: Unit,
		data: { title: string; order: number },
	) => Promise<void>;
	onDeleteUnit: (unit: Unit) => Promise<void>;
	initialAdding?: boolean;
}

export default function UnitSettingsModal({
	course,
	onClose,
	onAddUnit,
	onUpdateUnit,
	onDeleteUnit,
	initialAdding = false,
}: UnitSettingsModalProps) {
	const [addingUnit, setAddingUnit] = useState(initialAdding);
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
	const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

	const sorted = [...(course.units ?? [])].sort((a, b) => a.order - b.order);

	return (
		<Modal
			title="Unit Settings"
			size="lg"
			onClose={onClose}
		>
			<div className="flex flex-col gap-4">
				<div>
					{addingUnit ? (
						<div className="px-3 py-3 rounded-lg bg-surface-raised border border-border">
							<UnitForm
								nextOrder={(course.units?.length ?? 0) + 1}
								onSubmit={async (data) => {
									await onAddUnit(data);
									setAddingUnit(false);
								}}
								onCancel={() => setAddingUnit(false)}
							/>
						</div>
					) : (
						<button
							onClick={() => {
								setAddingUnit(true);
								setEditingUnit(null);
							}}
							className="text-sm text-primary hover:text-primary/80 font-medium"
						>
							+ Add Unit
						</button>
					)}
				</div>
				{sorted.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No units yet.
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{sorted.map((unit) => (
							<div key={unit.id}>
								<div className="flex items-center gap-3 rounded-lg bg-surface border border-border px-3 py-2">
									<span className="w-6 h-6 flex items-center justify-center rounded bg-primary-subtle text-primary text-xs font-bold shrink-0">
										{unit.order}
									</span>
									<span className="flex-1 font-medium text-foreground text-sm truncate">
										{unit.title}
									</span>
									<div className="flex gap-1 shrink-0">
										<button
											onClick={() => {
												setEditingUnit((prev) =>
													prev?.id === unit.id
														? null
														: unit,
												);

                      }}
											className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors"
										>
											Edit
										</button>
										<button
											onClick={() =>
												setDeletingUnit(unit)
											}
											className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors"
										>
											Delete
										</button>
									</div>
								</div>

								{editingUnit?.id === unit.id && (
									<div className="mt-2 px-3 py-3 rounded-lg bg-surface-raised border border-border">
										<UnitForm
											initial={unit}
											onSubmit={(data) =>
												onUpdateUnit(unit, data)
											}
											onCancel={() =>
												setEditingUnit(null)
											}
										/>
									</div>
								)}

								{deletingUnit?.id === unit.id && (
									<ConfirmDialog
										title="Delete Unit"
										message={`Delete "${unit.title}"? All lessons inside will also be deleted.`}
										onConfirm={async () => {
											await onDeleteUnit(unit);
											setDeletingUnit(null);
										}}
										onClose={() => setDeletingUnit(null)}
									/>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</Modal>
	);
}
