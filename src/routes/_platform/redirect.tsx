import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute('/_platform/redirect')({
	component: RouteComponent,
	beforeLoad: ({ context, search }) => {
		console.log('redirecting to', search.to)
		throw redirect({
			to: `/{-$slug}/${search.to}` as '/{-$slug}',
			params: {
				slug: context.auth.org.slug ?? undefined
			}
		})
	},
	validateSearch: z.object({
		to: z.string().default('/')
	})
})

function RouteComponent() {
	return null
}
