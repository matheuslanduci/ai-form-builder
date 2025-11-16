import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => {
	console.log('Setting up start instance with Clerk middleware')

	return {
		requestMiddleware: [clerkMiddleware()]
	}
})
