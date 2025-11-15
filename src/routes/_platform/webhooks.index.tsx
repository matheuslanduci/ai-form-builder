import { useOrganization } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { Admin } from '~/components/admin'
import { Layout } from '~/components/layout/layout'
import { Button } from '~/components/ui/button'
import { WebhooksTable } from '~/components/webhooks/webhooks-table'

const webhooksQueryOptions = (businessId: string) =>
	queryOptions(
		convexQuery(api.webhook.list, {
			businessId
		})
	)

export const Route = createFileRoute('/_platform/webhooks/')({
	loader: async ({ context }) => {
		const businessId = context.auth.org.id ?? (context.auth.userId as string)

		const webhooks = await context.queryClient.ensureQueryData(
			webhooksQueryOptions(businessId)
		)

		return { webhooks }
	},
	component: RouteComponent
})

function RouteComponent() {
	const { organization } = useOrganization()
	const { auth } = Route.useRouteContext()

	const businessId = organization?.id ?? (auth.userId as string)

	const { data: webhooks } = useSuspenseQuery(webhooksQueryOptions(businessId))

	return (
		<Layout
			actions={
				<Admin>
					<Button asChild size="sm">
						<Link to="/webhooks/new">New Webhook</Link>
					</Button>
				</Admin>
			}
			title="Webhooks"
		>
			<WebhooksTable businessId={businessId} webhooks={webhooks} />
		</Layout>
	)
}
