import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'

export const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
	const data = await auth()

	return {
		userId: data.userId,
		org: {
			id: data.orgId,
			role: data.orgRole,
			permissions: data.orgPermissions,
			slug: data.orgSlug
		}
	}
})
