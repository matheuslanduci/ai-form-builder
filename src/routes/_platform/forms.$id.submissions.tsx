import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Download, Eye, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Admin } from '~/components/admin'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Pagination } from '~/components/ui/pagination'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'
import { envClient } from '~/env/env.client'
import { seo } from '~/lib/seo'

type Submission = {
	_id: Id<'formSubmission'>
	_creationTime: number
	formId: Id<'form'>
	submittedAt: number
	data: Record<string, string | string[]>
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

function SubmissionMenuItems({
	variant,
	onViewClick,
	onDeleteClick
}: {
	variant: 'dropdown' | 'context'
	onViewClick: () => void
	onDeleteClick: () => void
}) {
	const { Item, Label } = MENU_COMPONENTS[variant]

	return (
		<>
			<Label>Actions</Label>
			<Item onClick={onViewClick}>
				<Eye className="mr-2 h-4 w-4" />
				View
			</Item>
			<Admin>
				<Item className="text-destructive" onClick={onDeleteClick}>
					<Trash2 className="mr-2 h-4 w-4 text-destructive" />
					Delete
				</Item>
			</Admin>
		</>
	)
}

const submissionsSearchSchema = z.object({
	cursor: z.string().nullable().catch(null).default(null)
})

export const Route = createFileRoute('/_platform/forms/$id/submissions')({
	component: RouteComponent,
	validateSearch: submissionsSearchSchema,
	head: () => ({
		meta: seo({
			title: 'Form Submissions - Landuci Form',
			description: 'View and manage form submissions'
		})
	})
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()
	const [cursorStack, setCursorStack] = useState<(string | null)[]>([])
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
						paginationOpts: { numItems: 20, cursor: search.cursor }
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

	const generateExportTokenMutation = useMutation({
		mutationFn: useConvexMutation(api.export.generateExportToken),
		onSuccess: (data: { token: string; expiresAt: number }) => {
			// Get Convex URL from environment
			const convexUrl = envClient.VITE_CONVEX_SITE

			if (!convexUrl) {
				toast.error('Configuration error: Convex URL not found')
				return
			}

			// Construct the export URL
			const exportUrl = new URL('/export-csv', convexUrl)
			exportUrl.searchParams.set('token', data.token)

			// Trigger download
			window.open(exportUrl.toString(), '_blank')
			toast.success('CSV export started')
		},
		onError: () => {
			toast.error('Failed to generate export token')
		}
	})

	const exportToCSV = () => {
		if (!formId || !isOrgLoaded) return

		const businessId = organization?.id ?? (user?.id as string)

		toast.info('Preparing CSV export...')

		generateExportTokenMutation.mutate({
			formId: formId as Id<'form'>,
			businessId
		})
	}

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
		if (!submissionsResult?.continueCursor || submissionsResult.isDone) return
		setCursorStack((prev) => [...prev, search.cursor])
		navigate({
			search: { cursor: submissionsResult.continueCursor }
		})
	}

	const handlePrevPage = () => {
		setCursorStack((prev) => {
			if (prev.length === 0) return prev
			const newStack = [...prev]
			const previousCursor = newStack.pop() as string | null
			navigate({
				search: { cursor: previousCursor }
			})
			return newStack
		})
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

	const handleDeleteSubmission = (submissionId: Id<'formSubmission'>) => {
		deleteSubmissionMutation.mutate({
			submissionId,
			businessId: organization?.id ?? (user?.id as string)
		})
	}

	return (
		<div className="h-full overflow-auto">
			<div className="mx-auto max-w-4xl p-6 space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Submissions
						</h1>
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
							{submissions.length === 0 ? (
								<TableRow>
									<TableCell
										className="h-24 text-center"
										colSpan={sortedFields.slice(0, 3).length + 2}
									>
										No results.
									</TableCell>
								</TableRow>
							) : (
								submissions.map((submission) => (
									<ContextMenu key={submission._id}>
										<ContextMenuTrigger asChild>
											<TableRow
												className="cursor-pointer"
												onClick={(e) => {
													// Don't trigger if clicking on the dropdown button
													const target = e.target as HTMLElement
													if (
														target.closest('button') ||
														target.closest('[role="menuitem"]')
													) {
														return
													}
													setSelectedSubmission(submission)
												}}
											>
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
												<TableCell onClick={(e) => e.stopPropagation()}>
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
								))
							)}
						</TableBody>
					</Table>
				</div>

				{submissions.length > 0 && (
					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-500">
							Showing {submissions.length} submissions
						</div>
						<Pagination
							className="flex items-center gap-2"
							hasNext={hasMore}
							hasPrevious={cursorStack.length > 0}
							onNext={handleNextPage}
							onPrevious={handlePrevPage}
						/>
					</div>
				)}
			</div>

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
