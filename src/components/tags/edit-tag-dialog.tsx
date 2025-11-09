import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from 'convex/_generated/api'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	ColorPicker,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerEyeDropper,
	ColorPickerHueSlider,
	ColorPickerInput,
	ColorPickerSwatch,
	ColorPickerTrigger
} from '~/components/ui/color-picker'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { Tag } from './types'

interface EditTagDialogProps {
	tag: Tag | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditTagDialog({ tag, open, onOpenChange }: EditTagDialogProps) {
	const [name, setName] = useState(tag?.name || '')
	const [color, setColor] = useState(tag?.color || '#3b82f6')

	// Reset form when tag changes
	useEffect(() => {
		if (tag) {
			setName(tag.name)
			setColor(tag.color || '#3b82f6')
		}
	}, [tag])

	const updateMutation = useMutation({
		mutationFn: useConvexMutation(api.tag.update),
		onSuccess: () => {
			toast.success('Tag updated successfully')
			onOpenChange(false)
		},
		onError: () => {
			toast.error('Failed to update tag')
		}
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!tag) return

		updateMutation.mutate({
			id: tag._id,
			name,
			color
		})
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Tag</DialogTitle>
					<DialogDescription>Update the tag name and color</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								autoComplete="off"
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Tag name"
								required
								value={name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<ColorPicker onValueChange={setColor} value={color}>
								<ColorPickerTrigger asChild>
									<Button className="w-full justify-start" variant="outline">
										<ColorPickerSwatch className="size-4 mr-2" />
										{color}
									</Button>
								</ColorPickerTrigger>
								<ColorPickerContent>
									<ColorPickerArea />
									<ColorPickerHueSlider />
									<div className="flex items-center gap-2">
										<ColorPickerInput />
										<ColorPickerEyeDropper />
									</div>
								</ColorPickerContent>
							</ColorPicker>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={updateMutation.isPending} type="submit">
							{updateMutation.isPending ? 'Updating...' : 'Update'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
