import { ConvexQueryClient } from '@convex-dev/react-query'
import {
	MutationCache,
	notifyManager,
	QueryClient
} from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { toast } from 'sonner'
import { envClient } from './env/env.client'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	if (typeof document !== 'undefined') {
		notifyManager.setScheduler(window.requestAnimationFrame)
	}

	const convexQueryClient = new ConvexQueryClient(envClient.VITE_CONVEX_URL)

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn()
			}
		},
		mutationCache: new MutationCache({
			onError: (error) => {
				toast.error(error.message || 'An error occurred')
			}
		})
	})

	convexQueryClient.connect(queryClient)

	const router = createRouter({
		routeTree,
		defaultPreload: 'intent',
		context: { queryClient, convex: convexQueryClient.convexClient },
		scrollRestoration: true
	})
	setupRouterSsrQueryIntegration({
		router,
		queryClient
	})

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
