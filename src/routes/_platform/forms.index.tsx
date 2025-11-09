import { useOrganization } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useState } from 'react'
import { z } from 'zod'
import { columns } from '~/components/forms/columns'
import { DataTable } from '~/components/forms/data-table'
import { Layout } from '~/components/layout/layout'
import { Button } from '~/components/ui/button'
import { seo } from '~/lib/seo'

const formsSearchSchema = z.object({
	cursor: z.string().nullable().catch(null).default(null)
})

export const Route = createFileRoute('/_platform/forms/')({
	component: RouteComponent,
	validateSearch: formsSearchSchema,
	head: () => ({
		meta: seo({
			title: 'My Forms - AI Form Builder',
			description: 'View and manage all your forms'
		})
	})
})

function RouteComponent() {
	const { organization, isLoaded } = useOrganization()
	const { auth } = Route.useRouteContext()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const [cursorStack, setCursorStack] = useState<(string | null)[]>([])

	const { isLoading, data } = useQuery(
		convexQuery(
			api.form.list,
			isLoaded
				? {
						businessId: organization?.id ?? (auth.userId as string),
						paginationOpts: {
							numItems: 20,
							cursor: search.cursor
						}
					}
				: 'skip'
		)
	)
	const createFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.create),
		onSuccess: (data: Id<'form'>) => {
			navigate({
				to: '/forms/$id',
				params: { id: data }
			})
		}
	})

	function handleNext() {
		if (!data?.continueCursor || data.isDone) return
		setCursorStack((prev) => [...prev, search.cursor])
		navigate({
			search: { cursor: data.continueCursor }
		})
	}

	function handlePrev() {
		setCursorStack((prev) => {
			if (prev.length === 0) return prev
			const newStack = [...prev]
			const previousCursor = newStack.pop() as string | null
			navigate({
				search: { cursor: previousCursor }
			})
			return newStack
		})
	}

	return (
		<Layout
			actions={
				<Button
					onClick={() =>
						createFormMutation.mutate({
							businessId: organization?.id ?? (auth.userId as string),
							title: 'Untitled Form'
						})
					}
					size="sm"
				>
					New Form
				</Button>
			}
			title="Forms"
		>
			<DataTable
				columns={columns}
				data={data?.page ?? []}
				hasNext={!data?.isDone}
				hasPrev={cursorStack.length > 0}
				isLoading={isLoading}
				onNext={handleNext}
				onPrev={handlePrev}
			/>
		</Layout>
	)
}
