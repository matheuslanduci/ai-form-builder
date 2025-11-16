import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_auth/sign-up/$')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Sign Up - Landuci Form',
			description: 'Sign up for your Landuci Form account'
		})
	})
})

function RouteComponent() {
	return (
		<div className="w-screen h-screen flex items-center justify-center">
			<SignUp />
		</div>
	)
}
