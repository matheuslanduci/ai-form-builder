import { useOrganization } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import {
	queryOptions,
	useMutation,
	useSuspenseQuery
} from '@tanstack/react-query'
import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
	useParams
} from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ExternalLink, Eye, Send, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { seo } from '~/lib/seo'
import { cn } from '~/lib/utils'

const formQueryOptions = (formId: Id<'form'>, businessId: string) =>
	queryOptions(
		convexQuery(api.form.get, {
			formId,
			businessId
		})
	)

export const Route = createFileRoute('/_platform/forms/$id')({
	loader: async ({ context, params }) => {
		const formId = params.id as Id<'form'>
		const businessId = context.auth.org.id ?? (context.auth.userId as string)

		const form = await context.queryClient.ensureQueryData(
			formQueryOptions(formId, businessId)
		)

		if (!form) {
			throw notFound()
		}

		return { form }
	},
	component: RouteComponent,
	head: ({ loaderData }) => ({
		meta: loaderData
			? seo({
					title: `${loaderData.form.title} - AI Form Builder`,
					description: loaderData.form.description || 'Manage your form'
				})
			: undefined
	})
})

const NAV_ITEMS = [
	{ label: 'Form', path: '/forms/$id' },
	{ label: 'Submissions', path: '/forms/$id/submissions' },
	{ label: 'Analytics', path: '/forms/$id/analytics' },
	{ label: 'Timeline', path: '/forms/$id/timeline' },
	{ label: 'Settings', path: '/forms/$id/settings' }
] as const

function RouteComponent() {
	const { organization } = useOrganization()
	const { auth } = Route.useRouteContext()
	const { id } = useParams({ strict: false })
	const [shareDialogOpen, setShareDialogOpen] = useState(false)

	const businessId = organization?.id ?? (auth.userId as string)

	const { data: form } = useSuspenseQuery(
		formQueryOptions(id as Id<'form'>, businessId)
	)

	const updateStatusMutationFn = useConvexMutation(api.form.updateStatus)
	const updateStatusMutation = useMutation({
		mutationFn: updateStatusMutationFn,
		onSuccess: () => {
			toast.success('Form status updated successfully!')
		},
		onError: () => {
			toast.error('Failed to update form status')
		}
	})

	function getMainAction() {
		if (!form) return null

		if (form.status === 'draft') {
			return (
				<Button
					disabled={updateStatusMutation.isPending}
					onClick={() => {
						updateStatusMutation.mutate({
							formId: id as Id<'form'>,
							status: 'published'
						})
					}}
					size="sm"
				>
					<Send className="mr-2 h-4 w-4" />
					{updateStatusMutation.isPending ? 'Publishing...' : 'Publish'}
				</Button>
			)
		}

		if (form.status === 'published') {
			return (
				<Button onClick={() => setShareDialogOpen(true)} size="sm">
					<Share2 className="mr-2 h-4 w-4" />
					Share
				</Button>
			)
		}

		if (form.status === 'archived') {
			return (
				<Button asChild size="sm" variant="secondary">
					<Link from="/forms/$id" to="/forms/$id/submissions">
						<Eye className="mr-2 h-4 w-4" />
						Submissions
					</Link>
				</Button>
			)
		}
	}

	return (
		<>
			<div className="flex h-screen flex-col">
				<div className="border-b">
					<div className="flex h-14 items-center justify-between px-6">
						<div className="flex items-center gap-6">
							<h1 className="text-lg font-semibold">{form?.title}</h1>

							<Separator className="h-6!" orientation="vertical" />

							<nav className="flex items-center gap-1">
								{NAV_ITEMS.map((item) => {
									return (
										<Link
											activeOptions={{
												exact: item.path === '/forms/$id'
											}}
											activeProps={{
												className: 'bg-secondary text-secondary-foreground'
											}}
											className={cn(
												'rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
											)}
											key={item.path}
											params={{ id: id as string }}
											to={item.path}
										>
											{item.label}
										</Link>
									)
								})}
							</nav>
						</div>

						<div className="flex items-center gap-2">
							<Button asChild size="sm" variant="outline">
								<a
									href={`/forms/${id}/preview`}
									rel="noopener noreferrer"
									target="_blank"
								>
									<ExternalLink className="h-4 w-4" />
									Preview
								</a>
							</Button>
							{getMainAction()}
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					<Outlet />
				</div>
			</div>

			{/* Share Dialog */}
			{form && (
				<ShareFormDialog
					formId={id as string}
					formTitle={form.title}
					isUpdatingStatus={updateStatusMutation.isPending}
					onOpenChange={setShareDialogOpen}
					onStatusChange={(status) => {
						updateStatusMutation.mutate({
							formId: id as Id<'form'>,
							status
						})
					}}
					open={shareDialogOpen}
					status={form.status}
				/>
			)}
		</>
	)
}
