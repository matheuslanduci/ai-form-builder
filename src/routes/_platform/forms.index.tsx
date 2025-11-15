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
import {
	type Filter,
	type FilterFieldConfig,
	Filters
} from '~/components/ui/filters'
import { seo } from '~/lib/seo'

const formsSearchSchema = z.object({
	cursor: z.string().nullable().catch(null).default(null),
	tags: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.catch(undefined)
		.transform((val) => {
			if (!val) return []
			if (typeof val === 'string') {
				return val ? val.split(',').filter(Boolean) : []
			}
			// Handle array case (shouldn't happen but be defensive)
			return Array.isArray(val) ? val : []
		})
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

	// Load tags for the filter
	const { data: tags } = useQuery(
		convexQuery(
			api.tag.list,
			isLoaded
				? {
						businessId: organization?.id ?? (auth.userId as string)
					}
				: 'skip'
		)
	)

	// Initialize filters from URL search params
	const initialFilters: Filter<string>[] =
		search.tags.length > 0
			? [
					{
						id: '1',
						field: 'tags',
						operator: 'includesAllOf',
						values: search.tags
					}
				]
			: []

	const [filters, setFilters] = useState<Filter<string>[]>(initialFilters)

	// Convert search params to filter IDs
	const selectedTagIds = search.tags.map((t) => t as Id<'tag'>)
	const hasActiveFilters = selectedTagIds.length > 0

	const { isLoading, data } = useQuery(
		convexQuery(
			api.form.list,
			isLoaded
				? {
						businessId: organization?.id ?? (auth.userId as string),
						tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
						paginationOpts: {
							numItems: 10,
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

	const filterFields: FilterFieldConfig<string>[] = [
		{
			key: 'tags',
			label: 'Tags',
			type: 'multiselect',
			operators: [
				{
					value: 'includesAllOf',
					label: 'includes all of',
					supportsMultiple: true
				}
			],
			defaultOperator: 'includesAllOf',
			options: (tags || []).map((tag) => ({
				value: tag._id,
				label: tag.name
			}))
		}
	]

	// Handle filter changes
	const handleFilterChange = (newFilters: Filter<string>[]) => {
		setFilters(newFilters)

		// Extract tag filters
		const tagFilter = newFilters.find((f) => f.field === 'tags')
		const tagIds = tagFilter?.values || []

		// Update URL
		navigate({
			search: {
				cursor: null,
				tags: tagIds.length > 0 ? tagIds.join(',') : undefined
			}
		})

		// Reset cursor stack when filters change
		setCursorStack([])
	}

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
			<div className="space-y-4">
				<Filters
					addButtonText="Add filter"
					fields={filterFields}
					filters={filters}
					onChange={handleFilterChange}
					showAddButton={true}
				/>
				<DataTable
					columns={columns}
					data={data?.page ?? []}
					hasNext={!hasActiveFilters && !data?.isDone}
					hasPrev={!hasActiveFilters && cursorStack.length > 0}
					isLoading={isLoading}
					onNext={handleNext}
					onPrev={handlePrev}
				/>
			</div>
		</Layout>
	)
}
