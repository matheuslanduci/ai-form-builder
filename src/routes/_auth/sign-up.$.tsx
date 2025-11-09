import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_auth/sign-up/$')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Sign Up - AI Form Builder',
			description: 'Sign up for your AI Form Builder account'
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
