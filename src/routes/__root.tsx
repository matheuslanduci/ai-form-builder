import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts
} from '@tanstack/react-router'
import type { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type * as React from 'react'
import { Toaster } from '~/components/ui/sonner'
import { envClient } from '~/env/env.client'
import { getAuth } from '~/server/auth.server'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{
	convex: ConvexReactClient
	queryClient: QueryClient
}>()({
	beforeLoad: async () => {
		const data = await getAuth()

		return { auth: data }
	},
	head: () => ({
		meta: [
			{
				charSet: 'utf-8'
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1'
			},
			{
				title: 'AI Form Builder'
			},
			{
				name: 'description',
				content: 'An AI-powered form builder application.'
			}
		],
		links: [{ rel: 'stylesheet', href: appCss }]
	}),
	component: RootComponent,
	notFoundComponent: () => <div>404 - Page Not Found</div>
})

function RootComponent() {
	const { convex } = Route.useRouteContext()

	return (
		<ClerkProvider
			afterSignOutUrl="/sign-in"
			publishableKey={envClient.VITE_CLERK_PUBLISHABLE_KEY}
			signInFallbackRedirectUrl="/redirect"
			signInUrl="/sign-in"
			signUpForceRedirectUrl="/redirect"
			signUpUrl="/sign-up"
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<RootDocument>
					<Outlet />
					<Toaster />
				</RootDocument>
			</ConvexProviderWithClerk>
		</ClerkProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
