import { Link } from '@tanstack/react-router'
import type { Id } from 'convex/_generated/dataModel'
import { Checkbox } from '~/components/ui/checkbox'

interface Tag {
	_id: Id<'tag'>
	name: string
	color?: string
}

interface TagsSectionProps {
	tags: Tag[] | undefined
	selectedTags: Id<'tag'>[]
	onTagToggle: (tagId: Id<'tag'>) => void
}

export function TagsSection({
	tags,
	selectedTags,
	onTagToggle
}: TagsSectionProps) {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Tags</h2>
				<p className="text-sm text-gray-500 mt-1">
					Organize your forms with tags
				</p>
			</div>

			{tags && tags.length > 0 ? (
				<div className="space-y-3">
					{tags.map((tag) => (
						<div className="flex items-center space-x-2" key={tag._id}>
							<Checkbox
								checked={selectedTags.includes(tag._id)}
								id={`tag-${tag._id}`}
								onCheckedChange={() => onTagToggle(tag._id)}
							/>
							<label
								className="flex items-center gap-2 text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
								htmlFor={`tag-${tag._id}`}
							>
								<span
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: tag.color || '#3b82f6' }}
								/>
								{tag.name}
							</label>
						</div>
					))}
				</div>
			) : (
				<p className="text-sm text-gray-500">
					No tags available.{' '}
					<Link
						className="text-primary underline underline-offset-4"
						to="/tags"
					>
						Create tags
					</Link>{' '}
					to organize your forms.
				</p>
			)}
		</div>
	)
}
