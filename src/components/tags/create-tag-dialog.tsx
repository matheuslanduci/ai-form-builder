import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from 'convex/_generated/api'
import { useState } from 'react'
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

interface CreateTagDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CreateTagDialog({ open, onOpenChange }: CreateTagDialogProps) {
	const { organization } = useOrganization()
	const { user } = useUser()
	const [name, setName] = useState('')
	const [color, setColor] = useState('#3b82f6')

	const businessId = organization?.id ?? (user?.id as string)

	const createMutation = useMutation({
		mutationFn: useConvexMutation(api.tag.create),
		onSuccess: () => {
			toast.success('Tag created successfully')
			setName('')
			setColor('#3b82f6')
			onOpenChange(false)
		},
		onError: () => {
			toast.error('Failed to create tag')
		}
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		createMutation.mutate({
			businessId,
			name,
			color
		})
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Tag</DialogTitle>
					<DialogDescription>
						Create a new tag to organize your forms
					</DialogDescription>
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
						<Button disabled={createMutation.isPending} type="submit">
							{createMutation.isPending ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
