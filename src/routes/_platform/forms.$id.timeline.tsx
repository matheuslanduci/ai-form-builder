import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Calendar } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { TimelineEntryCard } from '~/components/forms/timeline/timeline-entry-card'
import { Pagination } from '~/components/ui/pagination'
import { seo } from '~/lib/seo'

const timelineSearchSchema = z.object({
	cursor: z.string().nullable().catch(null).default(null)
})

export const Route = createFileRoute('/_platform/forms/$id/timeline')({
	component: RouteComponent,
	validateSearch: timelineSearchSchema,
	head: () => ({
		meta: seo({
			title: 'Form Timeline - AI Form Builder',
			description: 'View the edit history of your form'
		})
	})
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const search = Route.useSearch()
	const navigate = Route.useNavigate()
	const { organization } = useOrganization()
	const { user } = useUser()
	const [cursorStack, setCursorStack] = useState<(string | null)[]>([])

	const businessId = organization?.id ?? user?.id

	const { data, isLoading } = useQuery(
		convexQuery(
			api.formEditHistory.list,
			businessId
				? {
						formId: formId as Id<'form'>,
						businessId,
						paginationOpts: { numItems: 20, cursor: search.cursor }
					}
				: 'skip'
		)
	)

	const restoreMutation = useMutation({
		mutationFn: useConvexMutation(api.formEditHistory.restore),
		onSuccess: () => {
			toast.success('Successfully restored to previous state')
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to restore')
		}
	})

	function handleNext() {
		if (!data?.continueCursor || data.isDone) return
		// Push current cursor to stack before moving forward
		setCursorStack((prev) => [...prev, search.cursor])
		navigate({
			search: { cursor: data.continueCursor }
		})
	}

	function handlePrev() {
		// Pop the last cursor from the stack to go back one page
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

	function handleRestore(historyId: Id<'formEditHistory'>) {
		if (!businessId) return
		restoreMutation.mutate({
			historyId,
			businessId
		})
	}

	if (!businessId || isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		)
	}

	const entries = data?.page ?? []

	return (
		<div className="h-full overflow-auto">
			<div className="mx-auto max-w-4xl p-6 space-y-8">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">
						Edit Timeline
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						View the complete history of changes made to this form
					</p>
				</div>

				<div className="space-y-6">
					{entries.length === 0 ? (
						<div className="bg-muted/50 rounded-lg border border-dashed p-12 text-center">
							<Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<h3 className="mb-2 text-lg font-semibold">No edits yet</h3>
							<p className="text-muted-foreground text-sm">
								Changes to this form will appear here
							</p>
						</div>
					) : (
						<div className="relative">
							{/* Timeline entries */}
							<div className="space-y-8">
								{entries.map((entry, index) => {
									const isLast = index === entries.length - 1
									return (
										<TimelineEntryCard
											entry={entry}
											isLast={isLast}
											isRestoring={restoreMutation.isPending}
											key={entry._id}
											onRestore={handleRestore}
										/>
									)
								})}
							</div>
						</div>
					)}

					{(search.cursor !== null || (data && !data.isDone)) && (
						<Pagination
							className="flex justify-center gap-2 pt-4"
							hasNext={!data?.isDone}
							hasPrevious={cursorStack.length > 0}
							onNext={handleNext}
							onPrevious={handlePrev}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
