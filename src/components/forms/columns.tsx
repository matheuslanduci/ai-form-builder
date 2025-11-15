import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from 'convex/_generated/api'
import type { Doc } from 'convex/_generated/dataModel'
import {
	Archive,
	Check,
	Clock,
	Copy,
	Edit,
	ExternalLink,
	Eye,
	FileText,
	MoreHorizontal,
	Plus,
	Send,
	Share2,
	Tags,
	Trash,
	Undo
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Admin } from '~/components/admin'
import { Button } from '~/components/ui/button'
import {
	ColorPicker,
	ColorPickerAlphaSlider,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerEyeDropper,
	ColorPickerFormatSelect,
	ColorPickerHueSlider,
	ColorPickerInput,
	ColorPickerSwatch,
	ColorPickerTrigger
} from '~/components/ui/color-picker'
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from '~/components/ui/command'
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator
} from '~/components/ui/context-menu'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select'
import { cn } from '~/lib/utils'
import { ShareFormDialog } from './share-form-dialog'

export type Form = Doc<'form'>

const STATUS_CONFIG = {
	draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
	published: { label: 'Published', className: 'bg-green-100 text-green-700' },
	archived: { label: 'Archived', className: 'bg-orange-100 text-orange-700' }
} as const

function StatusSelect({ form }: { form: Form }) {
	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Status updated successfully')
		}
	})

	const handleStatusChange = (
		newStatus: 'draft' | 'published' | 'archived'
	) => {
		updateStatusMutation.mutate({
			formId: form._id,
			status: newStatus
		})
	}

	const config = STATUS_CONFIG[form.status]

	return (
		<Select onValueChange={handleStatusChange} value={form.status}>
			<SelectTrigger className="h-7 w-fit border-0 px-2 text-xs font-medium shadow-none">
				<SelectValue>
					<span
						className={`inline-flex items-center rounded-full px-2 py-0.5 ${config.className}`}
					>
						{config.label}
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="draft">
					<span className="inline-flex items-center rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">
						Draft
					</span>
				</SelectItem>
				<SelectItem value="published">
					<span className="inline-flex items-center rounded-full px-2 py-0.5 bg-green-100 text-green-700">
						Published
					</span>
				</SelectItem>
				<SelectItem value="archived">
					<span className="inline-flex items-center rounded-full px-2 py-0.5 bg-orange-100 text-orange-700">
						Archived
					</span>
				</SelectItem>
			</SelectContent>
		</Select>
	)
}

function TagsCombobox({ form }: { form: Form }) {
	const [open, setOpen] = useState(false)
	const [createFormOpen, setCreateFormOpen] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const [newTagName, setNewTagName] = useState('')
	const [newTagColor, setNewTagColor] = useState('#3b82f6')
	const { user } = useUser()
	const { organization } = useOrganization()

	const { data: tags } = useQuery(
		convexQuery(api.tag.list, {
			businessId: organization?.id ?? (user?.id as string)
		})
	)

	const filteredTags = tags?.filter((tag) =>
		tag.name.toLowerCase().includes(searchValue.toLowerCase())
	)

	const updateTagsMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateTags),
		onSuccess: () => {
			toast.success('Tags updated successfully')
		}
	})

	const createTagMutation = useMutation({
		mutationFn: useConvexMutation(api.tag.create),
		onSuccess: () => {
			toast.success('Tag created successfully')
			setCreateFormOpen(false)
			setNewTagName('')
			setNewTagColor('#3b82f6')
		}
	})

	const handleToggleTag = (tagId: string) => {
		const tagIdTyped = tagId as Doc<'tag'>['_id']
		const newTags = form.tags.includes(tagIdTyped)
			? form.tags.filter((id) => id !== tagIdTyped)
			: [...form.tags, tagIdTyped]

		updateTagsMutation.mutate({
			formId: form._id,
			tags: newTags
		})
	}

	const handleSubmitNewTag = (e: React.FormEvent) => {
		e.preventDefault()
		if (!newTagName.trim()) return

		createTagMutation.mutate({
			businessId: organization?.id ?? (user?.id as string),
			name: newTagName.trim(),
			color: newTagColor
		})
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="h-7 gap-1 px-2 text-xs font-normal"
					role="combobox"
					size="sm"
					variant="ghost"
				>
					<Tags className="h-3 w-3" />
					{form.tags.length > 0 ? (
						<span className="text-muted-foreground">
							{form.tags.length} {form.tags.length === 1 ? 'tag' : 'tags'}
						</span>
					) : (
						<span className="text-muted-foreground">Add tags</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[200px] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={setSearchValue}
						placeholder="Search tags..."
						value={searchValue}
					/>
					<CommandList>
						{filteredTags && filteredTags.length > 0 && (
							<CommandGroup>
								{filteredTags.map((tag) => (
									<CommandItem
										key={tag._id}
										onSelect={() => handleToggleTag(tag._id)}
										value={tag._id}
									>
										<Check
											className={cn(
												'mr-2 h-4 w-4',
												form.tags.includes(tag._id)
													? 'opacity-100'
													: 'opacity-0'
											)}
										/>
										<span
											className="mr-2 h-2 w-2 rounded-full"
											style={{ backgroundColor: tag.color || '#3b82f6' }}
										/>
										{tag.name}
									</CommandItem>
								))}
							</CommandGroup>
						)}
						{filteredTags && filteredTags.length > 0 && <CommandSeparator />}
						<CommandGroup>
							<Popover
								modal={false}
								onOpenChange={setCreateFormOpen}
								open={createFormOpen}
							>
								<PopoverTrigger asChild>
									<CommandItem
										keywords={['create', 'new', 'tag', 'add']}
										onSelect={() => {
											setCreateFormOpen(true)
										}}
									>
										<Plus className="mr-2 h-4 w-4" />
										Create new tag
									</CommandItem>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-80"
									onInteractOutside={(e) => e.preventDefault()}
									side="right"
								>
									<div className="space-y-4">
										<div className="space-y-2">
											<h4 className="font-medium leading-none">
												Create New Tag
											</h4>
											<p className="text-sm text-muted-foreground">
												Add a new tag to organize your forms
											</p>
										</div>
										<form
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault()
													handleSubmitNewTag(e)
												}
											}}
											onSubmit={handleSubmitNewTag}
										>
											<div className="space-y-4">
												<div className="space-y-2">
													<label
														className="text-sm font-medium"
														htmlFor="tag-name"
													>
														Tag Name
													</label>
													<Input
														autoFocus
														id="tag-name"
														onChange={(e) => setNewTagName(e.target.value)}
														placeholder="Enter tag name"
														value={newTagName}
													/>
												</div>
												<div className="space-y-2">
													<label
														className="text-sm font-medium"
														htmlFor="tag-color"
													>
														Color
													</label>
													<ColorPicker
														defaultFormat="hex"
														onValueChange={setNewTagColor}
														value={newTagColor}
													>
														<ColorPickerTrigger asChild>
															<ColorPickerSwatch />
														</ColorPickerTrigger>
														<ColorPickerContent>
															<ColorPickerArea />
															<div className="flex items-center gap-2">
																<ColorPickerEyeDropper />
																<div className="flex flex-1 flex-col gap-2">
																	<ColorPickerHueSlider />
																	<ColorPickerAlphaSlider />
																</div>
															</div>
															<div className="flex items-center gap-2">
																<ColorPickerFormatSelect />
																<ColorPickerInput />
															</div>
														</ColorPickerContent>
													</ColorPicker>
												</div>
												<div className="flex justify-end gap-2">
													<Button
														onClick={() => setCreateFormOpen(false)}
														size="sm"
														type="button"
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={
															!newTagName.trim() || createTagMutation.isPending
														}
														onClick={(e) => {
															e.preventDefault()
															e.stopPropagation()
															handleSubmitNewTag(e)
														}}
														size="sm"
														type="button"
													>
														{createTagMutation.isPending
															? 'Creating...'
															: 'Create'}
													</Button>
												</div>
											</div>
										</form>
									</div>
								</PopoverContent>
							</Popover>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

const MENU_COMPONENTS = {
	dropdown: {
		Item: DropdownMenuItem,
		Label: DropdownMenuLabel,
		Separator: DropdownMenuSeparator
	},
	context: {
		Item: ContextMenuItem,
		Label: ContextMenuLabel,
		Separator: ContextMenuSeparator
	}
} as const

export function FormMenuItems({
	form,
	variant,
	onDeleteClick,
	onShareClick
}: {
	form: Form
	variant: 'dropdown' | 'context'
	onDeleteClick?: () => void
	onShareClick?: () => void
}) {
	const { Item, Label, Separator } = MENU_COMPONENTS[variant]
	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Status updated successfully')
		}
	})

	const handleCopyFormId = (e: React.MouseEvent) => {
		e.preventDefault()
		navigator.clipboard.writeText(form._id)
		toast.success('Form ID copied to clipboard')
	}

	const handleStatusChange = (
		newStatus: 'draft' | 'published' | 'archived'
	) => {
		updateStatusMutation.mutate({
			formId: form._id,
			status: newStatus
		})
	}

	return (
		<>
			<Label>Actions</Label>

			<Item asChild>
				<Link params={{ id: form._id }} to="/forms/$id">
					<Edit className="mr-2 h-4 w-4" />
					Edit
				</Link>
			</Item>

			<Item asChild>
				<a
					href={`/forms/${form._id}/preview`}
					rel="noopener noreferrer"
					target="_blank"
				>
					<ExternalLink className="mr-2 h-4 w-4" />
					Preview
				</a>
			</Item>

			{form.status !== 'archived' && (
				<Item
					onClick={(e) => {
						e.preventDefault()
						onShareClick?.()
					}}
				>
					<Share2 className="mr-2 h-4 w-4" />
					Share
				</Item>
			)}

			<Item asChild>
				<Link params={{ id: form._id }} to="/forms/$id/submissions">
					<Eye className="mr-2 h-4 w-4" />
					View submissions
				</Link>
			</Item>

			<Separator />

			{form.status === 'draft' && (
				<Item onClick={() => handleStatusChange('published')}>
					<Send className="mr-2 h-4 w-4" />
					Publish
				</Item>
			)}

			{form.status === 'published' && (
				<Item onClick={() => handleStatusChange('archived')}>
					<Archive className="mr-2 h-4 w-4" />
					Archive
				</Item>
			)}

			{form.status !== 'draft' && (
				<Item onClick={() => handleStatusChange('draft')}>
					<FileText className="mr-2 h-4 w-4" />
					Move to drafts
				</Item>
			)}

			{form.status === 'archived' && (
				<Item onClick={() => handleStatusChange('published')}>
					<Undo className="mr-2 h-4 w-4" />
					Restore
				</Item>
			)}

			<Separator />

			<Item asChild>
				<Link params={{ id: form._id }} to="/forms/$id/timeline">
					<Clock className="mr-2 h-4 w-4" />
					Timeline
				</Link>
			</Item>

			<Item onClick={handleCopyFormId}>
				<Copy className="mr-2 h-4 w-4" />
				Copy form ID
			</Item>

			<Separator />

			<Admin>
				<Item
					className="text-destructive"
					onClick={(e) => {
						e.preventDefault()
						onDeleteClick?.()
					}}
				>
					<Trash className="mr-2 h-4 w-4 text-destructive" />
					Delete
				</Item>
			</Admin>
		</>
	)
}

export function DeleteFormDialog({
	form,
	open,
	onOpenChange
}: {
	form: Form
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const { user } = useUser()
	const { organization } = useOrganization()

	const deleteMutation = useMutation({
		mutationFn: useConvexMutation(api.form.remove),
		onSuccess: () => {
			toast.success('Form deleted successfully')
			onOpenChange(false)
		},
		onError: () => {
			toast.error('Failed to delete form')
		}
	})

	const handleDelete = () => {
		deleteMutation.mutate({
			formId: form._id,
			businessId: organization?.id ?? (user?.id as string)
		})
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Form</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{form.title}"? This action cannot
						be undone. All form data, fields, and submission history will be
						permanently deleted.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
						variant="destructive"
					>
						{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export const columns: ColumnDef<Form>[] = [
	{
		accessorKey: 'title',
		header: 'Title',
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue('title')}</div>
		),
		size: 300
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			return <StatusSelect form={row.original} />
		},
		size: 120
	},
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => {
			return <TagsCombobox form={row.original} />
		},
		size: 150
	},
	{
		accessorKey: 'submissionCount',
		header: () => <div className="text-center">Submissions</div>,
		cell: ({ row }) => {
			const count = row.getValue('submissionCount') as number
			return <div className="text-center font-medium">{count}</div>
		},
		size: 120
	},
	{
		accessorKey: 'lastUpdatedAt',
		header: 'Last Updated',
		cell: ({ row }) => {
			const timestamp = row.getValue('lastUpdatedAt') as number | undefined
			if (!timestamp) return <div className="text-muted-foreground">Never</div>
			const date = new Date(timestamp)
			return (
				<div className="text-muted-foreground text-sm">
					{date.toLocaleDateString()}
				</div>
			)
		},
		size: 150
	},
	{
		id: 'actions',
		enableHiding: false,
		size: 50,
		cell: ({ row }) => {
			const form = row.original
			const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
			const [shareDialogOpen, setShareDialogOpen] = useState(false)

			const updateStatusMutation = useMutation({
				mutationFn: useConvexMutation(api.form.updateStatus),
				onSuccess: () => {
					toast.success('Status updated successfully')
				}
			})

			return (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="h-8 w-8 p-0" variant="ghost">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<FormMenuItems
								form={form}
								onDeleteClick={() => setDeleteDialogOpen(true)}
								onShareClick={() => setShareDialogOpen(true)}
								variant="dropdown"
							/>
						</DropdownMenuContent>
					</DropdownMenu>

					<DeleteFormDialog
						form={form}
						onOpenChange={setDeleteDialogOpen}
						open={deleteDialogOpen}
					/>

					<ShareFormDialog
						formId={form._id}
						formTitle={form.title}
						isUpdatingStatus={updateStatusMutation.isPending}
						onOpenChange={setShareDialogOpen}
						onStatusChange={(status) => {
							updateStatusMutation.mutate({
								formId: form._id,
								status
							})
						}}
						open={shareDialogOpen}
						status={form.status}
					/>
				</>
			)
		}
	}
]
