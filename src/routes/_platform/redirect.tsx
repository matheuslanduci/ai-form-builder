import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute('/_platform/redirect')({
	component: RouteComponent,
	beforeLoad: ({ search }) => {
		throw redirect({
			to: `/${search.to}` as '/'
		})
	},
	validateSearch: z.object({
		to: z.string().default('/')
	})
})

function RouteComponent() {
	return null
}
