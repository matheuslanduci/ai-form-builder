import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sign-in/$')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<div className="w-screen h-screen flex items-center justify-center">
			<SignIn />
		</div>
	)
}
