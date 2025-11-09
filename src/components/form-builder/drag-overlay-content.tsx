import { Calendar } from 'lucide-react'
import { Checkbox } from '~/components/ui/checkbox'

interface DragOverlayContentProps {
	activeId: string | null
}

export function DragOverlayContent({ activeId }: DragOverlayContentProps) {
	if (activeId === 'text-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="text-xs text-gray-400 border-b border-gray-200 pb-1">
						Short answer text
					</div>
				</div>
			</div>
		)
	}

	if (activeId === 'multiline-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="text-xs text-gray-400 border-b border-gray-200 pb-1 pt-2">
						Long answer text...
					</div>
				</div>
			</div>
		)
	}

	if (activeId === 'number-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="text-xs text-gray-400 border-b border-gray-200 pb-1">
						Number
					</div>
				</div>
			</div>
		)
	}

	if (activeId === 'select-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-1">
						Select an option...
					</div>
				</div>
			</div>
		)
	}

	if (activeId === 'checkbox-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-xs text-gray-400">
							<Checkbox className="h-3.5 w-3.5" disabled />
							<span>Option 1</span>
						</div>
						<div className="flex items-center gap-2 text-xs text-gray-400">
							<Checkbox className="h-3.5 w-3.5" disabled />
							<span>Option 2</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (activeId === 'date-field') {
		return (
			<div className="w-[300px] border border-gray-300 rounded-lg p-4 bg-white shadow-xl opacity-90">
				<div className="space-y-2">
					<div className="font-medium text-sm text-gray-700">
						Untitled Question
					</div>
					<div className="flex items-center gap-2 text-xs text-gray-400 border border-gray-200 rounded px-2 py-1">
						<Calendar className="h-3.5 w-3.5" />
						<span>MM/DD/YYYY</span>
					</div>
				</div>
			</div>
		)
	}

	return null
}
