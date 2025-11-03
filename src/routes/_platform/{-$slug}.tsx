import { useOrganization } from '@clerk/tanstack-react-start'
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_platform/{-$slug}')({
	component: RouteComponent
})

function RouteComponent() {
	const { slug } = Route.useParams()
	const { isLoaded, organization } = useOrganization()

	if (!isLoaded) return null

	if (organization?.slug !== slug) {
		return (
			<Navigate
				params={{ slug: organization?.slug ?? undefined }}
				to="/{-$slug}"
			/>
		)
	}

	return <Outlet />
}
