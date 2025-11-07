import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import {
	AlertCircle,
	Check,
	Clock,
	ExternalLink,
	Eye,
	Loader2,
	Save,
	Share2,
	Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DeleteFormDialog } from '~/components/forms/columns'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/_platform/forms/$id/settings')({
	component: RouteComponent
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
		'draft'
	)
	const [selectedTags, setSelectedTags] = useState<Id<'tag'>[]>([])
	const [hasChanges, setHasChanges] = useState(false)
	const [shareDialogOpen, setShareDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [deleteSubmissionsDialogOpen, setDeleteSubmissionsDialogOpen] =
		useState(false)

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

	// Initialize state when form loads
	useEffect(() => {
		if (form && !hasChanges) {
			setTitle(form.title)
			setDescription(form.description || '')
			setStatus(form.status)
			setSelectedTags(form.tags)
		}
	}, [form, hasChanges])

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

	const updateFormMutationFn = useConvexMutation(api.form.update)
	const updateFormMutation = useMutation({
		mutationFn: updateFormMutationFn,
		onSuccess: () => {
			toast.success('Form updated successfully')
			setHasChanges(false)
		},
		onError: () => {
			toast.error('Failed to update form')
		}
	})

	const updateStatusMutationFn = useConvexMutation(api.form.updateStatus)
	const updateStatusMutation = useMutation({
		mutationFn: updateStatusMutationFn,
		onSuccess: () => {
			toast.success('Status updated successfully')
		}
	})

	const updateTagsMutationFn = useConvexMutation(api.form.updateTags)
	const updateTagsMutation = useMutation({
		mutationFn: updateTagsMutationFn,
		onSuccess: () => {
			toast.success('Tags updated successfully')
		}
	})

	const deleteAllSubmissionsMutationFn = useConvexMutation(
		api.formSubmission.deleteAllSubmissions
	)
	const deleteAllSubmissionsMutation = useMutation({
		mutationFn: deleteAllSubmissionsMutationFn,
		onSuccess: () => {
			toast.success('All submissions deleted successfully')
			setDeleteSubmissionsDialogOpen(false)
		},
		onError: () => {
			toast.error('Failed to delete submissions')
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

	const handleSave = () => {
		updateFormMutation.mutate({
			formId: form._id,
			title: title.trim(),
			description: description.trim()
		})
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
		setHasChanges(true)
		updateTagsMutation.mutate({
			formId: form._id,
			tags: newTags
		})
	}

	const handleTitleChange = (value: string) => {
		setTitle(value)
		setHasChanges(true)
	}

	const handleDescriptionChange = (value: string) => {
		setDescription(value)
		setHasChanges(true)
	}

	const handleDeleteAllSubmissions = () => {
		deleteAllSubmissionsMutation.mutate({
			formId: form._id,
			businessId
		})
	}

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return 'Never'
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(timestamp))
	}

	return (
		<>
			<div className="h-full overflow-auto">
				<div className="mx-auto max-w-4xl p-6 space-y-8">
					{/* Header */}
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Form Settings
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Manage your form configuration and preferences
						</p>
					</div>

					{/* Quick Actions */}
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() => setShareDialogOpen(true)}
							size="sm"
							variant="outline"
						>
							<Share2 className="mr-2 h-4 w-4" />
							Share
						</Button>
						<Button asChild size="sm" variant="outline">
							<a
								href={`/forms/${form._id}/preview`}
								rel="noopener noreferrer"
								target="_blank"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Preview
							</a>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link params={{ id: form._id }} to="/forms/$id/submissions">
								<Eye className="mr-2 h-4 w-4" />
								View Submissions
							</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link params={{ id: form._id }} to="/forms/$id/timeline">
								<Clock className="mr-2 h-4 w-4" />
								Timeline
							</Link>
						</Button>
					</div>

					<Separator />

					{/* Basic Information */}
					<div className="space-y-6">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">
								Basic Information
							</h2>
							<p className="text-sm text-gray-500 mt-1">
								Update your form's title and description
							</p>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder="Enter form title"
									value={title}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									className="min-h-[100px] resize-y"
									id="description"
									onChange={(e) => handleDescriptionChange(e.target.value)}
									placeholder="Enter form description (optional)"
									value={description}
								/>
							</div>

							{hasChanges && (
								<Button
									disabled={
										!title.trim() ||
										title === form.title ||
										updateFormMutation.isPending
									}
									onClick={handleSave}
								>
									<Save className="mr-2 h-4 w-4" />
									{updateFormMutation.isPending ? 'Saving...' : 'Save Changes'}
								</Button>
							)}
						</div>
					</div>

					<Separator />

					{/* Status */}
					<div className="space-y-6">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">Status</h2>
							<p className="text-sm text-gray-500 mt-1">
								Control the visibility and accessibility of your form
							</p>
						</div>

						<Tabs onValueChange={handleStatusChange} value={status}>
							<TabsList>
								<TabsTrigger value="draft">Draft</TabsTrigger>
								<TabsTrigger value="published">Published</TabsTrigger>
								<TabsTrigger value="archived">Archived</TabsTrigger>
							</TabsList>
						</Tabs>

						{status === 'draft' && (
							<div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border">
								<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
								<p>
									This form is in draft mode and not publicly accessible.
									Publish it to make it available for submissions.
								</p>
							</div>
						)}

						{status === 'published' && (
							<div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900 border border-green-200">
								<Check className="h-4 w-4 mt-0.5 shrink-0" />
								<p>
									This form is published and accepting submissions. You can
									share the public link with others.
								</p>
							</div>
						)}

						{status === 'archived' && (
							<div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
								<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
								<p>
									This form is archived and not accepting new submissions. You
									can still view existing submissions.
								</p>
							</div>
						)}
					</div>

					<Separator />

					{/* Tags */}
					<div className="space-y-6">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">Tags</h2>
							<p className="text-sm text-gray-500 mt-1">
								Organize your forms with tags
							</p>
						</div>

						{tags && tags.length > 0 ? (
							<div className="space-y-3">
								{tags.map((tag) => (
									<div className="flex items-center space-x-2" key={tag._id}>
										<Checkbox
											checked={selectedTags.includes(tag._id)}
											id={`tag-${tag._id}`}
											onCheckedChange={() => handleTagToggle(tag._id)}
										/>
										<label
											className="flex items-center gap-2 text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
											htmlFor={`tag-${tag._id}`}
										>
											<span
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: tag.color || '#3b82f6' }}
											/>
											{tag.name}
										</label>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-500">
								No tags available. Create tags from the forms list page.
							</p>
						)}
					</div>

					<Separator />

					{/* Form Metadata */}
					<div className="space-y-6">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">
								Form Information
							</h2>
							<p className="text-sm text-gray-500 mt-1">
								Read-only information about your form
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="rounded-lg border p-4">
								<div className="text-sm text-gray-500">Submissions</div>
								<div className="text-2xl font-semibold mt-1">
									{form.submissionCount}
								</div>
							</div>
							<div className="rounded-lg border p-4">
								<div className="text-sm text-gray-500">Created</div>
								<div className="text-sm font-medium mt-1">
									{formatDate(form._creationTime)}
								</div>
							</div>
							<div className="rounded-lg border p-4">
								<div className="text-sm text-gray-500">Last Updated</div>
								<div className="text-sm font-medium mt-1">
									{formatDate(form.lastUpdatedAt)}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Form ID</Label>
							<div className="flex gap-2">
								<Input
									className="font-mono text-sm"
									onClick={(e) => e.currentTarget.select()}
									readOnly
									value={form._id}
								/>
								<Button
									onClick={() => {
										navigator.clipboard.writeText(form._id)
										toast.success('Form ID copied to clipboard')
									}}
									size="sm"
									variant="outline"
								>
									Copy
								</Button>
							</div>
						</div>
					</div>

					<Separator />

					{/* Danger Zone */}
					<div className="space-y-6">
						<div>
							<h2 className="text-lg font-semibold text-red-900">
								Danger Zone
							</h2>
							<p className="text-sm text-red-600 mt-1">
								Irreversible and destructive actions
							</p>
						</div>

						<div className="rounded-lg border border-red-200 bg-red-50 p-6 space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-medium text-red-900">
										Delete All Submissions
									</h3>
									<p className="text-sm text-red-700 mt-1">
										Permanently delete all {form.submissionCount} submissions.
										This action cannot be undone.
									</p>
								</div>
								<Button
									disabled={form.submissionCount === 0}
									onClick={() => setDeleteSubmissionsDialogOpen(true)}
									variant="destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete All
								</Button>
							</div>

							<Separator className="bg-red-200" />

							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-medium text-red-900">Delete Form</h3>
									<p className="text-sm text-red-700 mt-1">
										Permanently delete this form, all fields, and submissions.
										This action cannot be undone.
									</p>
								</div>
								<Button
									onClick={() => setDeleteDialogOpen(true)}
									variant="destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Form
								</Button>
							</div>
						</div>
					</div>
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
