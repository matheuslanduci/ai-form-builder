import {
	AlignLeft,
	Calendar,
	CheckSquare,
	Hash,
	ListPlus,
	Type
} from 'lucide-react'
import { DraggableFieldButton } from './draggable-field-button'
import type { FormFieldType } from './types'

interface FieldsSidebarPanelProps {
	onAddField: (type: FormFieldType) => void
}

export function FieldsSidebarPanel({ onAddField }: FieldsSidebarPanelProps) {
	return (
		<div className="space-y-4 p-6">
			<h3 className="font-semibold text-lg">Fields</h3>
			<div className="space-y-2">
				{/* Single Line Text Field */}
				<DraggableFieldButton
					description="Single line text input."
					icon={Type}
					id="text-field"
					onClick={() => onAddField('singleline')}
					title="Text"
				/>
				{/* Multiline Text Field */}
				<DraggableFieldButton
					description="Multiple lines text area."
					icon={AlignLeft}
					id="multiline-field"
					onClick={() => onAddField('multiline')}
					title="Multiline Text"
				/>
				{/* Number Field */}
				<DraggableFieldButton
					description="Numeric input field."
					icon={Hash}
					id="number-field"
					onClick={() => onAddField('number')}
					title="Number"
				/>
				{/* Select Field */}
				<DraggableFieldButton
					description="Dropdown select."
					icon={ListPlus}
					id="select-field"
					onClick={() => onAddField('select')}
					title="Select"
				/>
				{/* Checkbox Field */}
				<DraggableFieldButton
					description="Multiple choice checkboxes."
					icon={CheckSquare}
					id="checkbox-field"
					onClick={() => onAddField('checkbox')}
					title="Checkbox"
				/>
				{/* Date Field */}
				<DraggableFieldButton
					description="Date picker field."
					icon={Calendar}
					id="date-field"
					onClick={() => onAddField('date')}
					title="Date"
				/>
			</div>
		</div>
	)
}
