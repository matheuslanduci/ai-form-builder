import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DeleteFormDialog } from '~/components/forms/columns'
import { BasicInformationSection } from '~/components/forms/settings/basic-information-section'
import { DangerZoneSection } from '~/components/forms/settings/danger-zone-section'
import { EmailNotificationsSection } from '~/components/forms/settings/email-notifications-section'
import { FormMetadataSection } from '~/components/forms/settings/form-metadata-section'
import { QuickActionsSection } from '~/components/forms/settings/quick-actions-section'
import { StatusSection } from '~/components/forms/settings/status-section'
import { TagsSection } from '~/components/forms/settings/tags-section'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Separator } from '~/components/ui/separator'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/forms/$id/settings')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Form Settings - Landuci Form',
			description: 'Configure your form settings and preferences'
		})
	})
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [successMessage, setSuccessMessage] = useState('')
	const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
		'draft'
	)
	const [selectedTags, setSelectedTags] = useState<Id<'tag'>[]>([])
	const [shareDialogOpen, setShareDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [deleteSubmissionsDialogOpen, setDeleteSubmissionsDialogOpen] =
		useState(false)
	const [newNotificationEmail, setNewNotificationEmail] = useState('')
	const [editingNotification, setEditingNotification] = useState<{
		id: string
		email: string
	} | null>(null)

	const businessId = organization?.id ?? (user?.id as string)

	const { data: form, isLoading: isFormLoading } = useQuery(
		convexQuery(
			api.form.get,
			isOrgLoaded
				? {
						formId: formId as Id<'form'>,
						businessId
					}
				: 'skip'
		)
	)

	useEffect(() => {
		if (form) {
			setTitle(form.title)
			setDescription(form.description || '')
			setSuccessMessage(form.successMessage || '')
			setStatus(form.status)
			setSelectedTags(form.tags)
		}
	}, [form])

	const { data: tags } = useQuery(
		convexQuery(
			api.tag.list,
			isOrgLoaded
				? {
						businessId
					}
				: 'skip'
		)
	)

	const { data: notifications, isLoading: isNotificationsLoading } = useQuery(
		convexQuery(
			api.formNotification.list,
			isOrgLoaded && form
				? {
						formId: formId as Id<'form'>,
						businessId
					}
				: 'skip'
		)
	)

	const updateFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.update),
		onSuccess: () => {
			toast.success('Form updated successfully')
		},
		onError: () => {
			toast.error('Failed to update form')
		}
	})

	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Status updated successfully')
		}
	})

	const updateTagsMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateTags),
		onSuccess: () => {
			toast.success('Tags updated successfully')
		}
	})

	const deleteAllSubmissionsMutation = useMutation({
		mutationFn: useConvexMutation(api.formSubmission.deleteAllSubmissions),
		onSuccess: () => {
			toast.success('All submissions deleted successfully')
			setDeleteSubmissionsDialogOpen(false)
		},
		onError: () => {
			toast.error('Failed to delete submissions')
		}
	})

	const createNotificationMutation = useMutation({
		mutationFn: useConvexMutation(api.formNotification.create),
		onSuccess: () => {
			toast.success('Notification email added successfully')
			setNewNotificationEmail('')
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add notification email')
		}
	})

	const updateNotificationMutation = useMutation({
		mutationFn: useConvexMutation(api.formNotification.update),
		onSuccess: () => {
			toast.success('Notification email updated successfully')
			setEditingNotification(null)
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update notification email')
		}
	})

	const toggleNotificationMutation = useMutation({
		mutationFn: useConvexMutation(api.formNotification.toggleEnabled),
		onSuccess: () => {
			toast.success('Notification status updated')
		},
		onError: () => {
			toast.error('Failed to update notification status')
		}
	})

	const removeNotificationMutation = useMutation({
		mutationFn: useConvexMutation(api.formNotification.remove),
		onSuccess: () => {
			toast.success('Notification email removed successfully')
		},
		onError: () => {
			toast.error('Failed to remove notification email')
		}
	})

	if (isFormLoading || !isOrgLoaded) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		)
	}

	if (!form) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="text-lg font-semibold">Form not found</h2>
				</div>
			</div>
		)
	}

	const handleSave = (field: 'title' | 'description' | 'successMessage') => {
		if (!form) return

		const updates: {
			formId: Id<'form'>
			title?: string
			description?: string
			successMessage?: string
		} = {
			formId: form._id
		}

		// Only include fields that have changed
		if (field === 'title' && title.trim() !== form.title) {
			updates.title = title.trim()
		} else if (
			field === 'description' &&
			description.trim() !== (form.description || '')
		) {
			updates.description = description.trim()
		} else if (
			field === 'successMessage' &&
			successMessage.trim() !== (form.successMessage || '')
		) {
			updates.successMessage = successMessage.trim()
		}

		// Only save if there's actually a change
		if (Object.keys(updates).length > 1) {
			updateFormMutation.mutate(updates)
		}
	}

	const handleStatusChange = (newStatus: string) => {
		const typedStatus = newStatus as 'draft' | 'published' | 'archived'
		setStatus(typedStatus)
		updateStatusMutation.mutate({
			formId: form._id,
			status: typedStatus
		})
	}

	const handleTagToggle = (tagId: Id<'tag'>) => {
		const newTags = selectedTags.includes(tagId)
			? selectedTags.filter((id) => id !== tagId)
			: [...selectedTags, tagId]
		setSelectedTags(newTags)
		updateTagsMutation.mutate({
			formId: form._id,
			tags: newTags
		})
	}

	const handleTitleChange = (value: string) => {
		setTitle(value)
	}

	const handleDescriptionChange = (value: string) => {
		setDescription(value)
	}

	const handleSuccessMessageChange = (value: string) => {
		setSuccessMessage(value)
	}

	const handleTitleBlur = () => {
		handleSave('title')
	}

	const handleDescriptionBlur = () => {
		handleSave('description')
	}

	const handleSuccessMessageBlur = () => {
		handleSave('successMessage')
	}

	const handleDeleteAllSubmissions = () => {
		deleteAllSubmissionsMutation.mutate({
			formId: form._id,
			businessId
		})
	}

	const handleAddNotification = () => {
		if (!newNotificationEmail.trim()) {
			toast.error('Please enter an email address')
			return
		}

		createNotificationMutation.mutate({
			formId: form._id,
			businessId,
			email: newNotificationEmail.trim()
		})
	}

	const handleUpdateNotification = () => {
		if (!editingNotification || !editingNotification.email.trim()) {
			toast.error('Please enter an email address')
			return
		}

		updateNotificationMutation.mutate({
			notificationId: editingNotification.id as Id<'formNotification'>,
			businessId,
			email: editingNotification.email.trim()
		})
	}

	const handleToggleNotification = (
		notificationId: Id<'formNotification'>,
		enabled: boolean
	) => {
		toggleNotificationMutation.mutate({
			notificationId,
			businessId,
			enabled
		})
	}

	const handleRemoveNotification = (notificationId: Id<'formNotification'>) => {
		removeNotificationMutation.mutate({
			notificationId,
			businessId
		})
	}

	return (
		<>
			<div className="h-full overflow-auto">
				<div className="mx-auto max-w-4xl p-6 space-y-8">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Form Settings
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Manage your form configuration and preferences
						</p>
					</div>

					<QuickActionsSection
						formId={form._id}
						onShareClick={() => setShareDialogOpen(true)}
					/>

					<Separator />

					<BasicInformationSection
						description={description}
						isSaving={updateFormMutation.isPending}
						onDescriptionBlur={handleDescriptionBlur}
						onDescriptionChange={handleDescriptionChange}
						onSuccessMessageBlur={handleSuccessMessageBlur}
						onSuccessMessageChange={handleSuccessMessageChange}
						onTitleBlur={handleTitleBlur}
						onTitleChange={handleTitleChange}
						successMessage={successMessage}
						title={title}
					/>

					<Separator />

					<StatusSection onStatusChange={handleStatusChange} status={status} />

					<Separator />

					<TagsSection
						onTagToggle={handleTagToggle}
						selectedTags={selectedTags}
						tags={tags}
					/>

					<Separator />

					<EmailNotificationsSection
						editingNotification={editingNotification}
						isCreating={createNotificationMutation.isPending}
						isLoading={isNotificationsLoading}
						isUpdating={updateNotificationMutation.isPending}
						newEmail={newNotificationEmail}
						notifications={notifications}
						onAddNotification={handleAddNotification}
						onCancelEdit={() => setEditingNotification(null)}
						onEditEmailChange={(email) =>
							setEditingNotification((prev) =>
								prev ? { ...prev, email } : null
							)
						}
						onNewEmailChange={setNewNotificationEmail}
						onRemove={handleRemoveNotification}
						onStartEdit={(id, email) => setEditingNotification({ id, email })}
						onToggleEnabled={handleToggleNotification}
						onUpdateNotification={handleUpdateNotification}
					/>

					<Separator />

					<FormMetadataSection
						createdAt={form._creationTime}
						formId={form._id}
						lastUpdatedAt={form.lastUpdatedAt}
						onCopyFormId={() => {
							navigator.clipboard.writeText(form._id)
							toast.success('Form ID copied to clipboard')
						}}
						submissionCount={form.submissionCount}
					/>

					<Separator />

					<DangerZoneSection
						onDeleteAllSubmissions={() => setDeleteSubmissionsDialogOpen(true)}
						onDeleteForm={() => setDeleteDialogOpen(true)}
						submissionCount={form.submissionCount}
					/>
				</div>
			</div>

			{/* Dialogs */}
			<ShareFormDialog
				formId={form._id}
				formTitle={form.title}
				isUpdatingStatus={updateStatusMutation.isPending}
				onOpenChange={setShareDialogOpen}
				onStatusChange={(newStatus) => {
					setStatus(newStatus)
					updateStatusMutation.mutate({
						formId: form._id,
						status: newStatus
					})
				}}
				open={shareDialogOpen}
				status={form.status}
			/>

			<DeleteFormDialog
				form={form}
				onOpenChange={setDeleteDialogOpen}
				open={deleteDialogOpen}
			/>

			<Dialog
				onOpenChange={setDeleteSubmissionsDialogOpen}
				open={deleteSubmissionsDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete All Submissions</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete all {form.submissionCount}{' '}
							submissions for "{form.title}"? This action cannot be undone and
							all submission data will be permanently lost.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setDeleteSubmissionsDialogOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={deleteAllSubmissionsMutation.isPending}
							onClick={handleDeleteAllSubmissions}
							variant="destructive"
						>
							{deleteAllSubmissionsMutation.isPending
								? 'Deleting...'
								: 'Delete All Submissions'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
