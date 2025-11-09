import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_auth/sign-in/$')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Sign In - AI Form Builder',
			description: 'Sign in to your AI Form Builder account'
		})
	})
})

function RouteComponent() {
	return (
		<div className="w-screen h-screen flex items-center justify-center">
			<SignIn />
		</div>
	)
}
