import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		if (context.auth.userId) {
			throw redirect({
				to: '/{-$slug}'
			})
		}
	}
})

function RouteComponent() {
	return <Outlet />
}
