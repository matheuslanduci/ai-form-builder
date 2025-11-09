import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Plus, Star, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Toggle } from '~/components/ui/toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/tooltip'
import type { FormField } from './types'

interface SortableFormFieldProps {
	field: FormField
	onRemove: () => void
	onToggleRequired: () => void
	onDuplicate: () => void
	onUpdateTitle: (title: string) => void
	onUpdateOptions: (options: string[]) => void
}

export function SortableFormField({
	field,
	onRemove,
	onToggleRequired,
	onDuplicate,
	onUpdateTitle,
	onUpdateOptions
}: SortableFormFieldProps) {
	const [localOptions, setLocalOptions] = useState<string[]>(
		field.options || ['Option 1']
	)

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		isOver
	} = useSortable({ id: field._id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : 0
	}

	return (
		<div
			className="group relative border border-gray-200 rounded-lg pl-3.5 pt-3.5 p-6 hover:border-gray-300 transition-colors bg-white"
			ref={setNodeRef}
			style={style}
		>
			{isOver && (
				<div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" />
			)}
			<button
				className="absolute -top-3.5 -left-3.5 h-7 w-7 rounded-md bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-sm transition-colors"
				type="button"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-4 w-4 text-gray-500" />
			</button>
			<div className="pl-2">
				<div className="flex items-center gap-2 mb-2">
					<Input
						className="font-medium flex-1 border-0 shadow-none rounded-none border-b border-b-transparent hover:border-b-gray-300 focus:border-b-gray-300 px-0"
						defaultValue={field.title}
						onBlur={(e) => onUpdateTitle(e.target.value)}
						placeholder="Question"
					/>
				</div>
				{field.type === 'singleline' && (
					<Input
						className="text-sm text-gray-500"
						disabled
						placeholder="Short answer text"
					/>
				)}
				{field.type === 'multiline' && (
					<Textarea
						className="text-sm text-gray-500 resize-none"
						disabled
						placeholder="Long answer text"
						rows={3}
					/>
				)}
				{field.type === 'number' && (
					<Input
						className="text-sm text-gray-500"
						disabled
						placeholder="Number"
						type="number"
					/>
				)}
				{field.type === 'select' && (
					<div className="space-y-2">
						{localOptions.map((option, index) => (
							<div
								className="flex items-center gap-2"
								key={`${option}-${index.toString()}`}
							>
								<Input
									className="text-sm flex-1"
									defaultValue={option}
									onBlur={(e) => {
										const newOptions = [...localOptions]
										newOptions[index] = e.target.value
										setLocalOptions(newOptions)
										onUpdateOptions(newOptions)
									}}
									placeholder={`Option ${index + 1}`}
								/>
								{localOptions.length > 1 && (
									<Button
										className="h-8 w-8 p-0 text-gray-500"
										onClick={() => {
											const newOptions = localOptions.filter(
												(_, i) => i !== index
											)
											setLocalOptions(newOptions)
											onUpdateOptions(newOptions)
										}}
										size="icon"
										type="button"
										variant="ghost"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						<Button
							className="h-8 text-xs"
							onClick={() => {
								const newOptions = [
									...localOptions,
									`Option ${localOptions.length + 1}`
								]
								setLocalOptions(newOptions)
								onUpdateOptions(newOptions)
							}}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="h-3 w-3 mr-1" />
							Add Option
						</Button>
					</div>
				)}
				{field.type === 'checkbox' && (
					<div className="space-y-2">
						{localOptions.map((option, index) => (
							<div
								className="flex items-center gap-2"
								key={`${option}-${index.toString()}`}
							>
								<Checkbox className="mt-0.5" disabled />
								<Input
									className="text-sm flex-1"
									defaultValue={option}
									onBlur={(e) => {
										const newOptions = [...localOptions]
										newOptions[index] = e.target.value
										setLocalOptions(newOptions)
										onUpdateOptions(newOptions)
									}}
									placeholder={`Option ${index + 1}`}
								/>
								{localOptions.length > 1 && (
									<Button
										className="h-8 w-8 p-0 text-gray-500"
										onClick={() => {
											const newOptions = localOptions.filter(
												(_, i) => i !== index
											)
											setLocalOptions(newOptions)
											onUpdateOptions(newOptions)
										}}
										size="icon"
										type="button"
										variant="ghost"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						<Button
							className="h-8 text-xs"
							onClick={() => {
								const newOptions = [
									...localOptions,
									`Option ${localOptions.length + 1}`
								]
								setLocalOptions(newOptions)
								onUpdateOptions(newOptions)
							}}
							size="sm"
							type="button"
							variant="outline"
						>
							<Plus className="h-3 w-3 mr-1" />
							Add Option
						</Button>
					</div>
				)}
				{field.type === 'date' && (
					<Input
						className="text-sm text-gray-500"
						disabled
						placeholder="MM/DD/YYYY"
						type="date"
					/>
				)}
			</div>

			{/* Toolbar - visible on hover */}
			<div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-lg shadow-sm p-1">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-8 w-8 p-0"
								onClick={onDuplicate}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Copy className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Duplicate field</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Toggle
								aria-label="Toggle required"
								className="h-8 w-8 p-0 border-0 shadow-none"
								onPressedChange={onToggleRequired}
								pressed={field.required}
								size="sm"
								variant="outline"
							>
								<Star
									className={`h-4 w-4 ${field.required ? 'fill-current' : ''}`}
								/>
							</Toggle>
						</TooltipTrigger>
						<TooltipContent>
							<p>{field.required ? 'Optional' : 'Required'}</p>
						</TooltipContent>
					</Tooltip>

					<div className="h-4 w-px bg-gray-200 mx-1" />

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
								onClick={onRemove}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Delete field</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	)
}
