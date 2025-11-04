import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '~/components/sidebar/app-sidebar'
import { SidebarProvider } from '~/components/ui/sidebar'

export const Route = createFileRoute('/_platform')({
	component: RouteComponent,
	beforeLoad({ context }) {
		if (!context.auth.userId) {
			throw redirect({
				to: '/sign-in/$',
				params: {
					_splat: undefined
				}
			})
		}
	}
})

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-screen relative">
				<Outlet />
			</main>
		</SidebarProvider>
	)
}
