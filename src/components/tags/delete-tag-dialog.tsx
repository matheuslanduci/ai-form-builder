import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import type { Tag } from './types'

interface DeleteTagDialogProps {
	tag: Tag | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DeleteTagDialog({
	tag,
	open,
	onOpenChange
}: DeleteTagDialogProps) {
	const deleteMutation = useMutation({
		mutationFn: useConvexMutation(api.tag.remove),
		onSuccess: () => {
			toast.success('Tag deleted successfully')
			onOpenChange(false)
		},
		onError: () => {
			toast.error('Failed to delete tag')
		}
	})

	const handleDelete = () => {
		if (!tag) return
		deleteMutation.mutate({ id: tag._id })
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Tag</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this tag? This will remove the tag
						from all forms that use it.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
						variant="destructive"
					>
						{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
