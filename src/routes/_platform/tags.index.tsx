import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useState } from 'react'
import { Layout } from '~/components/layout/layout'
import { CreateTagDialog } from '~/components/tags/create-tag-dialog'
import { TagsTable } from '~/components/tags/tags-table'
import { Button } from '~/components/ui/button'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/tags/')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Tags - Landuci Form',
			description: 'Manage your form tags and categories'
		})
	})
})

function RouteComponent() {
	const { organization, isLoaded } = useOrganization()
	const { user } = useUser()
	const [createDialogOpen, setCreateDialogOpen] = useState(false)

	const businessId = organization?.id ?? (user?.id as string)

	const { data: tags = [], isLoading } = useQuery(
		convexQuery(
			api.tag.list,
			isLoaded
				? {
						businessId
					}
				: 'skip'
		)
	)

	return (
		<Layout
			actions={
				<Button onClick={() => setCreateDialogOpen(true)} size="sm">
					New Tag
				</Button>
			}
			title="Tags"
		>
			{isLoading ? (
				<div className="text-center py-8 text-muted-foreground">
					Loading tags...
				</div>
			) : (
				<TagsTable tags={tags} />
			)}

			<CreateTagDialog
				onOpenChange={setCreateDialogOpen}
				open={createDialogOpen}
			/>
		</Layout>
	)
}
