import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'

export const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
	const data = await auth()
	const token = await data.getToken({ template: 'convex' })

	return {
		token,
		userId: data.userId,
		org: {
			id: data.orgId,
			role: data.orgRole,
			permissions: data.orgPermissions,
			slug: data.orgSlug
		}
	}
})
