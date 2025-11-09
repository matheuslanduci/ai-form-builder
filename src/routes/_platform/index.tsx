import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ArrowRight, Inbox, List, Loader2, Plus, Tags } from 'lucide-react'
import { DashboardEmptyState } from '~/components/dashboard/dashboard-empty-state'
import { FormCard } from '~/components/dashboard/form-card'
import { QuickActionCard } from '~/components/dashboard/quick-action-card'
import { StatCard } from '~/components/dashboard/stat-card'
import { Layout } from '~/components/layout/layout'
import { Button } from '~/components/ui/button'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Dashboard - AI Form Builder',
			description: 'Manage your forms and submissions'
		})
	})
})

function RouteComponent() {
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()

	const businessId = organization?.id ?? (user?.id as string)

	const { data, isLoading } = useQuery(
		convexQuery(
			api.dashboard.getDashboardData,
			isOrgLoaded ? { businessId } : 'skip'
		)
	)

	const createFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.create),
		onSuccess: (formId: Id<'form'>) => {
			window.location.href = `/forms/${formId}`
		}
	})

	const handleCreateForm = () => {
		createFormMutation.mutate({
			businessId,
			title: 'Untitled Form'
		})
	}

	if (!isOrgLoaded || isLoading) {
		return (
			<Layout title="Dashboard">
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			</Layout>
		)
	}

	const hasNoForms = !data?.stats.totalForms

	return (
		<Layout title="Dashboard">
			<div className="space-y-8">
				{/* Welcome Section */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Welcome back{organization ? `, ${organization.name}` : ''}!
						</h1>
						<p className="text-gray-600 mt-1">
							Here's what's happening with your forms
						</p>
					</div>
					<Button
						disabled={createFormMutation.isPending}
						onClick={handleCreateForm}
						size="lg"
					>
						<Plus className="mr-2 h-5 w-5" />
						{createFormMutation.isPending ? 'Creating...' : 'Create New Form'}
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard
						isLoading={isLoading}
						label="Total Forms"
						value={data?.stats.totalForms}
					/>
					<StatCard
						isLoading={isLoading}
						label="Total Submissions"
						value={data?.stats.totalSubmissions}
					/>
					<StatCard
						isLoading={isLoading}
						label="Published Forms"
						value={data?.stats.publishedForms}
					/>
					<StatCard
						isLoading={isLoading}
						label="Tags"
						value={data?.stats.tagsCount}
					/>
				</div>

				{/* Empty State */}
				{hasNoForms && <DashboardEmptyState />}

				{/* Recent Forms */}
				{!hasNoForms && (
					<>
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold text-gray-900">
									Recent Forms
								</h2>
								<Button asChild size="sm" variant="outline">
									<Link to="/forms">
										View All
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
							<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
								{data?.recentForms.map((form) => (
									<FormCard form={form} key={form._id} />
								))}
							</div>
						</div>

						{/* Quick Actions */}
						<div>
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								Quick Actions
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<QuickActionCard
									description="Browse all your forms"
									icon={<List className="h-6 w-6 text-gray-600" />}
									label="View All Forms"
									to="/forms"
								/>
								<QuickActionCard
									description="Organize with tags"
									icon={<Tags className="h-6 w-6 text-gray-600" />}
									label="Manage Tags"
									to="/tags"
								/>
								<QuickActionCard
									description="View form responses"
									icon={<Inbox className="h-6 w-6 text-gray-600" />}
									label="Submissions"
									to="/forms"
								/>
								<QuickActionCard
									description="Start building a new form"
									icon={<Plus className="h-6 w-6 text-gray-600" />}
									label="Create Form"
									to="/forms"
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</Layout>
	)
}
