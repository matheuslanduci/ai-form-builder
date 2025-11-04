import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import {
	AlignLeft,
	Calendar,
	CheckSquare,
	Copy,
	GripVertical,
	Hash,
	ListPlus,
	Plus,
	Sparkles,
	Star,
	Trash2,
	Type,
	X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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

type FormField = {
	_id: Id<'formField'>
	formId: Id<'form'>
	pageId?: string
	type: 'singleline' | 'multiline' | 'number' | 'select' | 'checkbox' | 'date'
	title: string
	placeholder?: string
	required: boolean
	order: number
	options?: string[]
}

export const Route = createFileRoute('/_platform/{-$slug}/forms/$id/')({
	component: RouteComponent
})

function DraggableFieldButton({
	id,
	onClick,
	icon: Icon,
	title,
	description
}: {
	id: string
	onClick: () => void
	icon: React.ElementType
	title: string
	description: string
}) {
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

function DroppableFormArea({ children }: { children: React.ReactNode }) {
	const { setNodeRef } = useDroppable({
		id: 'form-drop-zone'
	})

	return (
		<div className="space-y-4 min-h-[calc(100vh-300px)] pb-24" ref={setNodeRef}>
			{children}
		</div>
	)
}

function SortableFormField({
	field,
	onRemove,
	onToggleRequired,
	onDuplicate,
	onUpdateTitle,
	onUpdateOptions
}: {
	field: FormField
	onRemove: () => void
	onToggleRequired: () => void
	onDuplicate: () => void
	onUpdateTitle: (title: string) => void
	onUpdateOptions: (options: string[]) => void
}) {
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

function RouteComponent() {
	const { id } = Route.useParams()
	const formId = id as Id<'form'>
	const { organization } = useOrganization()
	const { user } = useUser()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [selectedTool, setSelectedTool] = useState<'ai' | 'fields' | null>(null)
	const [activeId, setActiveId] = useState<string | null>(null)
	const queryClient = useQueryClient()

	const businessId = organization?.id ?? (user?.id as string)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8
			}
		})
	)

	// Fetch form
	const { data: form, isLoading } = useQuery(
		convexQuery(api.form.get, {
			formId,
			businessId
		})
	)

	// Fetch form fields
	const formFieldsQueryKey = [
		'convexQuery',
		api.formField.list,
		{ formId, businessId, pageId: undefined }
	]
	const { data: formFields = [] } = useQuery(
		convexQuery(api.formField.list, {
			formId,
			businessId,
			pageId: undefined
		})
	)

	// Mutation functions
	const createFieldFn = useConvexMutation(api.formField.create)
	const updateFieldFn = useConvexMutation(api.formField.update)
	const deleteFieldFn = useConvexMutation(api.formField.remove)
	const reorderFieldsFn = useConvexMutation(api.formField.reorder)

	// Mutations
	const updateFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.update),
		onError: () => toast.error('Failed to update form')
	})

	const createFieldMutation = useMutation({
		mutationFn: createFieldFn,
		onMutate: async (variables) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: formFieldsQueryKey })

			// Snapshot previous value
			const previousFields =
				queryClient.getQueryData<FormField[]>(formFieldsQueryKey)

			// Optimistically update
			const optimisticField = {
				_id: `temp-${Date.now()}` as Id<'formField'>,
				formId: variables.formId,
				pageId: variables.pageId,
				type: variables.type,
				title: variables.title,
				placeholder: variables.placeholder,
				required: variables.required,
				order: variables.order
			}

			queryClient.setQueryData<FormField[]>(formFieldsQueryKey, (old = []) => [
				...old,
				optimisticField
			])

			return { previousFields }
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousFields) {
				queryClient.setQueryData(formFieldsQueryKey, context.previousFields)
			}
			toast.error('Failed to create field')
		},
		onSettled: () => {
			// Refetch to ensure consistency
			queryClient.invalidateQueries({ queryKey: formFieldsQueryKey })
		}
	})

	const updateFieldMutation = useMutation({
		mutationFn: updateFieldFn,
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: formFieldsQueryKey })
			const previousFields =
				queryClient.getQueryData<FormField[]>(formFieldsQueryKey)

			queryClient.setQueryData<FormField[]>(formFieldsQueryKey, (old = []) =>
				old.map((field) =>
					field._id === variables.fieldId
						? {
								...field,
								...(variables.title && { title: variables.title }),
								...(variables.placeholder !== undefined && {
									placeholder: variables.placeholder
								}),
								...(variables.required !== undefined && {
									required: variables.required
								})
							}
						: field
				)
			)

			return { previousFields }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousFields) {
				queryClient.setQueryData(formFieldsQueryKey, context.previousFields)
			}
			toast.error('Failed to update field')
		}
	})

	const deleteFieldMutation = useMutation({
		mutationFn: deleteFieldFn,
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: formFieldsQueryKey })
			const previousFields =
				queryClient.getQueryData<FormField[]>(formFieldsQueryKey)

			queryClient.setQueryData<FormField[]>(formFieldsQueryKey, (old = []) =>
				old.filter((field) => field._id !== variables.fieldId)
			)

			return { previousFields }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousFields) {
				queryClient.setQueryData(formFieldsQueryKey, context.previousFields)
			}
			toast.error('Failed to delete field')
		}
	})

	const reorderFieldsMutation = useMutation({
		mutationFn: reorderFieldsFn,
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: formFieldsQueryKey })
			const previousFields =
				queryClient.getQueryData<FormField[]>(formFieldsQueryKey)

			// Create new array ordered by fieldIds
			const fieldMap = new Map(formFields.map((f) => [f._id, f]))
			const reorderedFields = variables.fieldIds
				.map((id: Id<'formField'>, index: number) => {
					const field = fieldMap.get(id)
					return field ? { ...field, order: index } : null
				})
				.filter((f): f is (typeof formFields)[number] => f !== null)

			queryClient.setQueryData<FormField[]>(formFieldsQueryKey, reorderedFields)

			return { previousFields }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousFields) {
				queryClient.setQueryData(formFieldsQueryKey, context.previousFields)
			}
			toast.error('Failed to reorder fields')
		}
	})

	useEffect(() => {
		if (form) {
			setTitle(form.title)
			setDescription(form.description || '')
		}
	}, [form])

	const handleTitleBlur = () => {
		if (form && title !== form.title) {
			updateFormMutation.mutate({ formId, title })
		}
	}

	const handleDescriptionBlur = () => {
		if (form && description !== (form.description || '')) {
			updateFormMutation.mutate({ formId, description })
		}
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		setActiveId(null)

		if (!over) return

		// Dragging from sidebar to form
		const fieldTypeMap: Record<string, FormField['type']> = {
			'text-field': 'singleline',
			'multiline-field': 'multiline',
			'number-field': 'number',
			'select-field': 'select',
			'checkbox-field': 'checkbox',
			'date-field': 'date'
		}

		const fieldType = fieldTypeMap[active.id as string]
		if (fieldType) {
			let order = formFields.length

			// If dropping on an existing field, insert before it
			if (over.id !== 'form-drop-zone') {
				const overIndex = formFields.findIndex((f) => f._id === over.id)
				if (overIndex !== -1) {
					order = overIndex
				}
			}

			createFieldMutation.mutate({
				formId,
				businessId,
				pageId: undefined,
				type: fieldType,
				title: 'Untitled Question',
				placeholder: '',
				required: false,
				order
			})
			return
		}

		// Reordering fields within the form
		if (active.id !== over.id) {
			const oldIndex = formFields.findIndex((f) => f._id === active.id)
			const newIndex = formFields.findIndex((f) => f._id === over.id)

			if (oldIndex !== -1 && newIndex !== -1) {
				const reorderedFields = arrayMove(formFields, oldIndex, newIndex)
				reorderFieldsMutation.mutate({
					formId,
					businessId,
					pageId: undefined,
					fieldIds: reorderedFields.map((f) => f._id)
				})
			}
		}
	}

	const addField = (type: FormField['type']) => {
		createFieldMutation.mutate({
			formId,
			businessId,
			pageId: undefined,
			type,
			title: 'Untitled Question',
			placeholder: '',
			required: false,
			order: formFields.length,
			options:
				type === 'select' || type === 'checkbox'
					? ['Option 1', 'Option 2', 'Option 3']
					: undefined
		})
	}

	const removeField = (fieldId: Id<'formField'>) => {
		deleteFieldMutation.mutate({ fieldId, businessId })
	}

	const toggleRequired = (fieldId: Id<'formField'>) => {
		const field = formFields.find((f) => f._id === fieldId)
		if (field) {
			updateFieldMutation.mutate({
				fieldId,
				businessId,
				required: !field.required
			})
		}
	}

	const updateFieldTitle = (fieldId: Id<'formField'>, title: string) => {
		updateFieldMutation.mutate({
			fieldId,
			businessId,
			title
		})
	}

	const updateFieldOptions = (fieldId: Id<'formField'>, options: string[]) => {
		updateFieldMutation.mutate({
			fieldId,
			businessId,
			options
		})
	}

	const duplicateField = (fieldId: Id<'formField'>) => {
		const field = formFields.find((f) => f._id === fieldId)
		if (field) {
			const fieldIndex = formFields.findIndex((f) => f._id === fieldId)
			createFieldMutation.mutate({
				formId,
				businessId,
				pageId: field.pageId,
				type: field.type,
				title: `${field.title} (Copy)`,
				placeholder: field.placeholder,
				required: field.required,
				order: fieldIndex + 1
			})
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		)
	}

	return (
		<DndContext
			onDragEnd={handleDragEnd}
			onDragStart={handleDragStart}
			sensors={sensors}
		>
			<div className="flex h-full">
				{/* Main content area */}
				<div className="flex-1 overflow-y-auto">
					<div className="mx-auto max-w-3xl p-6 space-y-8">
						<div className="space-y-3">
							<Input
								className="text-3xl! shadow-none border-b-transparent! border-b-2! h-auto! font-semibold! border-0 px-0 py-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-b-2 focus:border-b-gray-300! placeholder:text-gray-300 bg-transparent"
								onBlur={handleTitleBlur}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Form Title"
								value={title}
							/>
							<Textarea
								className="text-sm! font-normal shadow-none border-b-2 border-b-transparent! text-gray-600 border-0 px-0 py-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-b-2 focus:border-b-gray-300! placeholder:text-gray-400 resize-none min-h-8 bg-transparent"
								onBlur={handleDescriptionBlur}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Form description (optional)"
								rows={1}
								value={description}
							/>
						</div>

						{/* Form Fields Drop Zone */}
						<DroppableFormArea>
							<SortableContext
								items={formFields.map((f) => f._id)}
								strategy={verticalListSortingStrategy}
							>
								{formFields.map((field) => (
									<SortableFormField
										field={field}
										key={field._id}
										onDuplicate={() => duplicateField(field._id)}
										onRemove={() => removeField(field._id)}
										onToggleRequired={() => toggleRequired(field._id)}
										onUpdateOptions={(options) =>
											updateFieldOptions(field._id, options)
										}
										onUpdateTitle={(title) =>
											updateFieldTitle(field._id, title)
										}
									/>
								))}
							</SortableContext>
							{formFields.length === 0 && (
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
									Drag a field here or click a field type to add it
								</div>
							)}
						</DroppableFormArea>
					</div>
				</div>

				{/* Builder sidebar */}
				<div className="flex">
					{/* Sidebar content */}
					{selectedTool && (
						<div className="w-80 bg-white p-6 border-l border-gray-200">
							{selectedTool === 'ai' && (
								<div className="space-y-4">
									<h3 className="font-semibold text-lg">AI Assistant</h3>
									<p className="text-sm text-gray-600">
										Use AI to generate form fields and suggestions.
									</p>
								</div>
							)}
							{selectedTool === 'fields' && (
								<div className="space-y-4">
									<h3 className="font-semibold text-lg">Fields</h3>
									<div className="space-y-2">
										{/* Single Line Text Field */}
										<DraggableFieldButton
											description="Single line text input."
											icon={Type}
											id="text-field"
											onClick={() => addField('singleline')}
											title="Text"
										/>
										{/* Multiline Text Field */}
										<DraggableFieldButton
											description="Multiple lines text area."
											icon={AlignLeft}
											id="multiline-field"
											onClick={() => addField('multiline')}
											title="Multiline Text"
										/>
										{/* Number Field */}
										<DraggableFieldButton
											description="Numeric input field."
											icon={Hash}
											id="number-field"
											onClick={() => addField('number')}
											title="Number"
										/>
										{/* Select Field */}
										<DraggableFieldButton
											description="Dropdown select."
											icon={ListPlus}
											id="select-field"
											onClick={() => addField('select')}
											title="Select"
										/>
										{/* Checkbox Field */}
										<DraggableFieldButton
											description="Multiple choice checkboxes."
											icon={CheckSquare}
											id="checkbox-field"
											onClick={() => addField('checkbox')}
											title="Checkbox"
										/>
										{/* Date Field */}
										<DraggableFieldButton
											description="Date picker field."
											icon={Calendar}
											id="date-field"
											onClick={() => addField('date')}
											title="Date"
										/>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Sidebar icons */}
					<div className="w-16 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 gap-2">
						<Button
							onClick={() =>
								setSelectedTool(selectedTool === 'ai' ? null : 'ai')
							}
							size="icon"
							variant={selectedTool === 'ai' ? 'default' : 'ghost'}
						>
							<Sparkles className="h-5 w-5" />
						</Button>
						<Button
							onClick={() =>
								setSelectedTool(selectedTool === 'fields' ? null : 'fields')
							}
							size="icon"
							variant={selectedTool === 'fields' ? 'default' : 'ghost'}
						>
							<ListPlus className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<DragOverlay>
				{activeId === 'text-field' && (
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
				)}
				{activeId === 'multiline-field' && (
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
				)}
				{activeId === 'number-field' && (
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
				)}
				{activeId === 'select-field' && (
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
				)}
				{activeId === 'checkbox-field' && (
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
				)}
				{activeId === 'date-field' && (
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
				)}
			</DragOverlay>
		</DndContext>
	)
}
