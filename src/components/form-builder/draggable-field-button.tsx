import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'

interface DraggableFieldButtonProps {
	id: string
	onClick: () => void
	icon: React.ElementType
	title: string
	description: string
}

export function DraggableFieldButton({
	id,
	onClick,
	icon: Icon,
	title,
	description
}: DraggableFieldButtonProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id
	})

	return (
		<button
			className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
			onClick={onClick}
			ref={setNodeRef}
			type="button"
			{...listeners}
			{...attributes}
			style={{
				opacity: isDragging ? 0.5 : 1
			}}
		>
			<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
				<Icon className="h-5 w-5 text-gray-600" />
			</div>
			<div className="flex-1">
				<div className="font-medium text-sm">{title}</div>
				<div className="text-xs text-gray-500">{description}</div>
			</div>
			<GripVertical className="h-5 w-5 text-gray-400" />
		</button>
	)
}
