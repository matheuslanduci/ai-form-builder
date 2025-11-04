import { useOrganization } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import * as React from 'react'
import { columns } from '~/components/forms/columns'
import { DataTable } from '~/components/forms/data-table'
import { Layout } from '~/components/layout/layout'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/_platform/{-$slug}/forms/')({
	component: RouteComponent
})

function RouteComponent() {
	const { organization, isLoaded } = useOrganization()
	const { auth } = Route.useRouteContext()
	const [cursor, setCursor] = React.useState<string | null>(null)
	const [cursorStack, setCursorStack] = React.useState<(string | null)[]>([])
	const navigate = Route.useNavigate()
	const { slug } = Route.useParams()
	const { isLoading, data } = useQuery(
		convexQuery(
			api.form.list,
			isLoaded
				? {
						businessId: organization?.id ?? (auth.userId as string),
						paginationOpts: {
							numItems: 20,
							cursor: cursor
						}
					}
				: 'skip'
		)
	)
	const createFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.create),
		onSuccess: (data: Id<'form'>) => {
			navigate({
				to: '/{-$slug}/forms/$id',
				params: { slug, id: data }
			})
		}
	})

	function handleNext() {
		if (!data?.continueCursor || data.isDone) return
		setCursorStack((s) => [...s, cursor])
		setCursor(data.continueCursor)
	}

	function handlePrev() {
		setCursorStack((s) => {
			if (s.length === 0) return s
			const copy = [...s]
			const previous = copy.pop() as string | null
			setCursor(previous)
			return copy
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
