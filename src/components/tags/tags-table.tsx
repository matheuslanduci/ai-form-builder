import { Edit, MoreHorizontal, Trash } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'
import { DeleteTagDialog } from './delete-tag-dialog'
import { EditTagDialog } from './edit-tag-dialog'
import type { Tag } from './types'

const MENU_COMPONENTS = {
	dropdown: {
		Item: DropdownMenuItem,
		Label: DropdownMenuLabel,
		Separator: DropdownMenuSeparator
	},
	context: {
		Item: ContextMenuItem,
		Label: ContextMenuLabel,
		Separator: ContextMenuSeparator
	}
} as const

function TagMenuItems({
	variant,
	onEditClick,
	onDeleteClick
}: {
	variant: 'dropdown' | 'context'
	onEditClick: () => void
	onDeleteClick: () => void
}) {
	const { Item, Label } = MENU_COMPONENTS[variant]

	return (
		<>
			<Label>Actions</Label>
			<Item onClick={onEditClick}>
				<Edit className="mr-2 h-4 w-4" />
				Edit
			</Item>
			<Item className="text-destructive" onClick={onDeleteClick}>
				<Trash className="mr-2 h-4 w-4 text-destructive" />
				Delete
			</Item>
		</>
	)
}

interface TagsTableProps {
	tags: Tag[]
}

export function TagsTable({ tags }: TagsTableProps) {
	const [editTag, setEditTag] = useState<Tag | null>(null)
	const [deleteTag, setDeleteTag] = useState<Tag | null>(null)

	return (
		<>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Color</TableHead>
							<TableHead className="w-[100px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{tags.length > 0 ? (
							tags.map((tag) => (
								<ContextMenu key={tag._id}>
									<ContextMenuTrigger asChild>
										<TableRow className="cursor-pointer">
											<TableCell>
												<div className="flex items-center gap-2">
													<div
														className="h-4 w-4 rounded-full"
														style={{ backgroundColor: tag.color || '#3b82f6' }}
													/>
													<span className="font-medium">{tag.name}</span>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm text-muted-foreground">
													{tag.color || '#3b82f6'}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="h-8 w-8 p-0"
																onClick={(e) => e.stopPropagation()}
																variant="ghost"
															>
																<MoreHorizontal className="h-4 w-4" />
																<span className="sr-only">Open menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<TagMenuItems
																onDeleteClick={() => setDeleteTag(tag)}
																onEditClick={() => setEditTag(tag)}
																variant="dropdown"
															/>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</TableCell>
										</TableRow>
									</ContextMenuTrigger>
									<ContextMenuContent className="w-52">
										<TagMenuItems
											onDeleteClick={() => setDeleteTag(tag)}
											onEditClick={() => setEditTag(tag)}
											variant="context"
										/>
									</ContextMenuContent>
								</ContextMenu>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={3}>
									No tags found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<EditTagDialog
				onOpenChange={(open) => !open && setEditTag(null)}
				open={!!editTag}
				tag={editTag}
			/>
			<DeleteTagDialog
				onOpenChange={(open) => !open && setDeleteTag(null)}
				open={!!deleteTag}
				tag={deleteTag}
			/>
		</>
	)
}
