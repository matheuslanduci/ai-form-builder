import { useOrganization } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ExternalLink, Eye, Send, Share2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_platform/{-$slug}/forms/$id')({
	component: RouteComponent
})

const NAV_ITEMS = [
	{ label: 'Form', path: '/{-$slug}/forms/$id' },
	{ label: 'Submissions', path: '/{-$slug}/forms/$id/submissions' },
	{ label: 'Timeline', path: '/{-$slug}/forms/$id/timeline' },
	{ label: 'Settings', path: '/{-$slug}/forms/$id/settings' }
] as const

function RouteComponent() {
	const { organization, isLoaded } = useOrganization()
	const { auth } = Route.useRouteContext()
	const { id } = Route.useParams()

	const {
		data: form,
		error,
		isLoading
	} = useQuery(
		convexQuery(
			api.form.get,
			isLoaded
				? {
						formId: id as Id<'form'>,
						businessId: organization?.id ?? (auth.userId as string)
					}
				: 'skip'
		)
	)

	function getMainAction() {
		if (!form) return null

		if (form.status === 'draft') {
			return (
				<Button size="sm">
					<Send className="mr-2 h-4 w-4" />
					Publish
				</Button>
			)
		}

		if (form.status === 'published') {
			return (
				<Button size="sm">
					<Share2 className="mr-2 h-4 w-4" />
					Share
				</Button>
			)
		}

		if (form.status === 'archived') {
			return (
				<Button asChild size="sm" variant="secondary">
					<Link from="/{-$slug}/forms/$id" to="/{-$slug}/forms/$id/submissions">
						<Eye className="mr-2 h-4 w-4" />
						Submissions
					</Link>
				</Button>
			)
		}
	}

	if (error) {
		return <Navigate from="/{-$slug}/forms/$id" to="/{-$slug}/forms" />
	}

	return (
		<div className="flex h-screen flex-col">
			<div className="border-b">
				<div className="flex h-14 items-center justify-between px-6">
					<div className="flex items-center gap-6">
						<h1 className="text-lg font-semibold">
							{isLoading ? <Skeleton className="h-6 w-48" /> : form?.title}
						</h1>

						<Separator className="h-6!" orientation="vertical" />

						<nav className="flex items-center gap-1">
							{NAV_ITEMS.map((item) => {
								return (
									<Link
										activeOptions={{
											exact: item.path === '/{-$slug}/forms/$id'
										}}
										activeProps={{
											className: 'bg-secondary text-secondary-foreground'
										}}
										className={cn(
											'rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
										)}
										from="/{-$slug}/forms/$id"
										key={item.path}
										to={item.path}
									>
										{item.label}
									</Link>
								)
							})}
						</nav>
					</div>

					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline">
							<ExternalLink className="h-4 w-4" />
							Preview
						</Button>
						{getMainAction()}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				<Outlet />
			</div>
		</div>
	)
}
