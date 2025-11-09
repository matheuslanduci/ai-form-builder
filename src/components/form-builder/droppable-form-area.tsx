import { useDroppable } from '@dnd-kit/core'

interface DroppableFormAreaProps {
	children: React.ReactNode
}

export function DroppableFormArea({ children }: DroppableFormAreaProps) {
	const { setNodeRef } = useDroppable({
		id: 'form-drop-zone'
	})

	return (
		<div className="space-y-4 min-h-[calc(100vh-300px)] pb-24" ref={setNodeRef}>
			{children}
		</div>
	)
}
