import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import {
	convexQuery,
	useConvexAction,
	useConvexMutation
} from '@convex-dev/react-query'
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ListPlus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AIAssistantPanel } from '~/components/form-builder/ai-assistant-panel'
import { DragOverlayContent } from '~/components/form-builder/drag-overlay-content'
import { DroppableFormArea } from '~/components/form-builder/droppable-form-area'
import { FieldsSidebarPanel } from '~/components/form-builder/fields-sidebar-panel'
import { SortableFormField } from '~/components/form-builder/sortable-form-field'
import type { ChatMessage, FormField } from '~/components/form-builder/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/forms/$id/')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Form Builder - AI Form Builder',
			description: 'Build and edit your form with AI assistance'
		})
	})
})

function RouteComponent() {
	const { id } = Route.useParams()
	const formId = id as Id<'form'>
	const { organization } = useOrganization()
	const { user } = useUser()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [selectedTool, setSelectedTool] = useState<'ai' | 'fields' | null>(null)
	const [activeId, setActiveId] = useState<string | null>(null)
	const [chatMessage, setChatMessage] = useState('')
	const [isAiProcessing, setIsAiProcessing] = useState(false)
	const chatScrollRef = useRef<HTMLDivElement>(null)
	const queryClient = useQueryClient()

	const businessId = organization?.id ?? (user?.id as string)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8
			}
		})
	)

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
	const chatMessagesQueryKey = convexQuery(api.chat.list, {
		formId,
		businessId
	})
	const { data: chatMessages = [] } = useQuery(chatMessagesQueryKey)

	// Enhance chat messages with streaming content
	const messagesWithStreams = useMemo(() => {
		return chatMessages.map((message) => {
			// If message has a streamId, we'll use the streaming content
			// Otherwise, use the stored content
			return {
				...message,
				// We'll update this when we get the stream content
				_streamId: message.streamId
			}
		})
	}, [chatMessages])

	// Mutation functions
	const createFieldFn = useConvexMutation(api.formField.create)
	const updateFieldFn = useConvexMutation(api.formField.update)
	const deleteFieldFn = useConvexMutation(api.formField.remove)
	const reorderFieldsFn = useConvexMutation(api.formField.reorder)
	const chatWithAgentFn = useConvexAction(api.aiFormBuilderAgent.chatWithAgent)

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

	const sendMessage = async () => {
		if (!chatMessage.trim()) return

		const messageToSend = chatMessage
		console.log('[SendMessage] Starting send', {
			messageToSend,
			formId,
			businessId
		})

		setChatMessage('') // Clear input immediately for better UX
		setIsAiProcessing(true)

		try {
			// Optimistic update: Add user message immediately
			const tempUserMessageId = `temp-user-${Date.now()}`
			console.log('[SendMessage] Adding optimistic user message', {
				tempUserMessageId
			})
			console.log('[SendMessage] Query key:', chatMessagesQueryKey)

			queryClient.setQueryData(
				chatMessagesQueryKey.queryKey,
				(old: typeof chatMessages) => {
					console.log('[SendMessage] Current chat messages:', old?.length || 0)
					const newMessages = [
						...(old || []),
						{
							_id: tempUserMessageId as Id<'chatMessage'>,
							_creationTime: Date.now(),
							formId,
							businessId,
							userId: user?.id,
							role: 'user' as const,
							content: messageToSend
						}
					]
					console.log(
						'[SendMessage] Updated to:',
						newMessages.length,
						'messages'
					)
					return newMessages
				}
			)

			// Scroll to bottom immediately
			setTimeout(() => {
				chatScrollRef.current?.scrollTo({
					top: chatScrollRef.current.scrollHeight,
					behavior: 'smooth'
				})
			}, 50)

			console.log('[SendMessage] Calling agent action...')
			// Send message to agent (no streaming, just wait for response)
			const result = await chatWithAgentFn({
				formId,
				businessId,
				content: messageToSend
			})

			console.log('[SendMessage] Agent completed', result)

			// Force refresh chat messages to get the actual messages from server
			console.log('[SendMessage] Invalidating query to force refresh...')
			await queryClient.invalidateQueries({
				queryKey: chatMessagesQueryKey.queryKey
			})

			console.log('[SendMessage] Query invalidated, should refetch now')

			// Scroll to bottom after a short delay
			setTimeout(() => {
				chatScrollRef.current?.scrollTo({
					top: chatScrollRef.current.scrollHeight,
					behavior: 'smooth'
				})
			}, 100)
		} catch (error) {
			console.error('[Form Builder Agent] Failed to send message', error)
			toast.error('Failed to send message')
		} finally {
			setIsAiProcessing(false)
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: Hacking around
	useEffect(() => {
		if (chatScrollRef.current) {
			chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
		}
	}, [chatMessages.length])

	// Track when AI responds to turn off processing state
	// biome-ignore lint/correctness/useExhaustiveDependencies: Hacking around
	useEffect(() => {
		const lastMessage = chatMessages[chatMessages.length - 1]
		if (lastMessage?.role === 'assistant' && isAiProcessing) {
			setIsAiProcessing(false)
		}
	}, [chatMessages.length])

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
						<div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
							{selectedTool === 'ai' && (
								<AIAssistantPanel
									chatMessage={chatMessage}
									isProcessing={isAiProcessing}
									messages={messagesWithStreams as ChatMessage[]}
									onChatMessageChange={setChatMessage}
									onSendMessage={sendMessage}
									userImage={user?.imageUrl || ''}
									userName={user?.fullName || 'User'}
								/>
							)}
							{selectedTool === 'fields' && (
								<FieldsSidebarPanel onAddField={addField} />
							)}
						</div>
					)}{' '}
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
				<DragOverlayContent activeId={activeId} />
			</DragOverlay>
		</DndContext>
	)
}
