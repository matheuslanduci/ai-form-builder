import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import {
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	Inbox,
	Loader2,
	MoreHorizontal,
	Trash2
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'

type Submission = {
	_id: Id<'formSubmission'>
	_creationTime: number
	formId: Id<'form'>
	submittedAt: number
	data: Record<string, string | string[]>
}

const MENU_COMPONENTS = {
	dropdown: {
		Item: DropdownMenuItem
	},
	context: {
		Item: ContextMenuItem
	}
} as const

function SubmissionMenuItems({
	variant,
	onViewClick,
	onDeleteClick
}: {
	variant: 'dropdown' | 'context'
	onViewClick: () => void
	onDeleteClick: () => void
}) {
	const { Item } = MENU_COMPONENTS[variant]

	return (
		<>
			<Item onClick={onViewClick}>
				<Eye className="mr-2 h-4 w-4" />
				View
			</Item>
			<Item className="text-destructive" onClick={onDeleteClick}>
				<Trash2 className="mr-2 h-4 w-4 text-destructive" />
				Delete
			</Item>
		</>
	)
}

export const Route = createFileRoute('/_platform/forms/$id/submissions')({
	component: RouteComponent
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()
	const [paginationCursor, setPaginationCursor] = useState<string | null>(null)
	const [selectedSubmission, setSelectedSubmission] =
		useState<Submission | null>(null)

	const { data: form, isLoading: isFormLoading } = useQuery(
		convexQuery(
			api.form.get,
			isOrgLoaded
				? {
						formId: formId as Id<'form'>,
						businessId: organization?.id ?? (user?.id as string)
					}
				: 'skip'
		)
	)

	const { data: fields, isLoading: isFieldsLoading } = useQuery(
		convexQuery(
			api.formField.list,
			isOrgLoaded
				? {
						formId: formId as Id<'form'>,
						businessId: organization?.id ?? (user?.id as string)
					}
				: 'skip'
		)
	)

	const { data: submissionsResult, isLoading: isSubmissionsLoading } = useQuery(
		convexQuery(
			api.formSubmission.list,
			isOrgLoaded && formId
				? {
						formId: formId as Id<'form'>,
						businessId: organization?.id ?? (user?.id as string),
						paginationOpts: { numItems: 20, cursor: paginationCursor }
					}
				: 'skip'
		)
	)

	const deleteSubmissionMutation = useMutation({
		mutationFn: useConvexMutation(api.formSubmission.deleteSubmission),
		onSuccess: () => {
			toast.success('Submission deleted successfully')
			setSelectedSubmission(null)
		},
		onError: () => {
			toast.error('Failed to delete submission')
		}
	})

	if (
		isFormLoading ||
		isFieldsLoading ||
		isSubmissionsLoading ||
		!isOrgLoaded
	) {
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

	const submissions = submissionsResult?.page || []
	const hasMore = submissionsResult?.isDone === false
	const sortedFields = fields?.sort((a, b) => a.order - b.order) || []

	const handleNextPage = () => {
		if (submissionsResult?.continueCursor) {
			setPaginationCursor(submissionsResult.continueCursor)
		}
	}

	const handlePrevPage = () => {
		setPaginationCursor(null)
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp)
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date)
	}

	const getFieldValue = (
		submissionData: Record<string, string | string[]>,
		fieldId: string
	) => {
		const value = submissionData[fieldId]
		if (value === undefined || value === null || value === '') {
			return <span className="text-gray-400 italic">No answer</span>
		}
		if (Array.isArray(value)) {
			return value.length > 0 ? (
				value.join(', ')
			) : (
				<span className="text-gray-400 italic">No answer</span>
			)
		}
		return String(value)
	}

	const exportToCSV = () => {
		// Will be implemented with Cloudflare Workers + Queues
		toast.info('CSV export will be available soon')
	}

	const handleDeleteSubmission = (submissionId: Id<'formSubmission'>) => {
		deleteSubmissionMutation.mutate({
			submissionId,
			businessId: organization?.id ?? (user?.id as string)
		})
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="border-b bg-white px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">Submissions</h2>
						<p className="text-sm text-gray-500 mt-1">
							{submissions.length} submission
							{submissions.length !== 1 ? 's' : ''} on this page
						</p>
					</div>
					<div className="flex items-center gap-3">
						{submissions.length > 0 && (
							<Button onClick={exportToCSV} variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Export CSV
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-6">
				{submissions.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center">
						<div className="rounded-full bg-gray-100 p-6 mb-4">
							<Inbox className="h-12 w-12 text-gray-400" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No submissions yet
						</h3>
						<p className="text-gray-500 max-w-md">
							Once people start submitting this form, their responses will
							appear here.
						</p>
					</div>
				) : (
					<>
						<div className="bg-white rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										{sortedFields.slice(0, 3).map((field) => (
											<TableHead key={field._id}>{field.title}</TableHead>
										))}
										<TableHead>Submitted At</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{submissions.map((submission) => (
										<ContextMenu key={submission._id}>
											<ContextMenuTrigger asChild>
												<TableRow>
													{sortedFields.slice(0, 3).map((field) => (
														<TableCell
															className="max-w-[300px] truncate"
															key={field._id}
														>
															{getFieldValue(submission.data, field._id)}
														</TableCell>
													))}
													<TableCell className="text-gray-600">
														{formatDate(submission.submittedAt)}
													</TableCell>
													<TableCell>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button size="icon" variant="ghost">
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<SubmissionMenuItems
																	onDeleteClick={() =>
																		handleDeleteSubmission(submission._id)
																	}
																	onViewClick={() =>
																		setSelectedSubmission(submission)
																	}
																	variant="dropdown"
																/>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											</ContextMenuTrigger>
											<ContextMenuContent className="w-44">
												<SubmissionMenuItems
													onDeleteClick={() =>
														handleDeleteSubmission(submission._id)
													}
													onViewClick={() => setSelectedSubmission(submission)}
													variant="context"
												/>
											</ContextMenuContent>
										</ContextMenu>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-gray-500">
								Showing {submissions.length} submissions
							</div>
							<div className="flex items-center gap-2">
								<Button
									disabled={paginationCursor === null}
									onClick={handlePrevPage}
									size="sm"
									variant="outline"
								>
									<ChevronLeft className="h-4 w-4 mr-1" />
									Previous
								</Button>
								<Button
									disabled={!hasMore}
									onClick={handleNextPage}
									size="sm"
									variant="outline"
								>
									Next
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Submission Detail Dialog */}
			<Dialog
				onOpenChange={() => setSelectedSubmission(null)}
				open={!!selectedSubmission}
			>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Submission Details</DialogTitle>
						<DialogDescription>
							Submitted on{' '}
							{selectedSubmission && formatDate(selectedSubmission.submittedAt)}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 mt-4">
						{selectedSubmission &&
							sortedFields.map((field) => (
								<div className="border-b pb-4 last:border-0" key={field._id}>
									<div className="text-sm font-medium text-gray-700 mb-1">
										{field.title}
										{field.required && (
											<span className="text-red-500 ml-1">*</span>
										)}
									</div>
									<div className="text-gray-900">
										{getFieldValue(selectedSubmission.data, field._id)}
									</div>
								</div>
							))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
