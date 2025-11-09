import { Loader2 } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface BasicInformationSectionProps {
	title: string
	description: string
	successMessage: string
	isSaving?: boolean
	onTitleChange: (value: string) => void
	onDescriptionChange: (value: string) => void
	onSuccessMessageChange: (value: string) => void
	onTitleBlur: () => void
	onDescriptionBlur: () => void
	onSuccessMessageBlur: () => void
}

export function BasicInformationSection({
	title,
	description,
	successMessage,
	isSaving,
	onTitleChange,
	onDescriptionChange,
	onSuccessMessageChange,
	onTitleBlur,
	onDescriptionBlur,
	onSuccessMessageBlur
}: BasicInformationSectionProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						Basic Information
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Update your form's title and description
					</p>
				</div>
				{isSaving && (
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Loader2 className="h-4 w-4 animate-spin" />
						Saving...
					</div>
				)}
			</div>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						onBlur={onTitleBlur}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder="Enter form title"
						value={title}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						className="min-h-[100px] resize-y"
						id="description"
						onBlur={onDescriptionBlur}
						onChange={(e) => onDescriptionChange(e.target.value)}
						placeholder="Enter form description (optional)"
						value={description}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="successMessage">Success Message</Label>
					<Textarea
						className="min-h-[100px] resize-y"
						id="successMessage"
						onBlur={onSuccessMessageBlur}
						onChange={(e) => onSuccessMessageChange(e.target.value)}
						placeholder="Thank you for your submission! We will get back to you soon. (optional)"
						value={successMessage}
					/>
					<p className="text-xs text-gray-500">
						This message will be shown to users after they submit the form
					</p>
				</div>
			</div>
		</div>
	)
}
