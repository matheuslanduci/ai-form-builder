import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
	component: RouteComponent,
	beforeLoad: ({ context }) => {
		if (context.auth.userId) {
			throw redirect({
				to: '/'
			})
		}
	}
})

function RouteComponent() {
	return <Outlet />
}
