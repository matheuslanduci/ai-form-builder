import { Link } from '@tanstack/react-router'
import type { Id } from 'convex/_generated/dataModel'
import { Clock, ExternalLink, Eye, Share2 } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface QuickActionsSectionProps {
	formId: Id<'form'>
	onShareClick: () => void
}

export function QuickActionsSection({
	formId,
	onShareClick
}: QuickActionsSectionProps) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button onClick={onShareClick} size="sm" variant="outline">
				<Share2 className="mr-2 h-4 w-4" />
				Share
			</Button>
			<Button asChild size="sm" variant="outline">
				<a
					href={`/forms/${formId}/preview`}
					rel="noopener noreferrer"
					target="_blank"
				>
					<ExternalLink className="mr-2 h-4 w-4" />
					Preview
				</a>
			</Button>
			<Button asChild size="sm" variant="outline">
				<Link params={{ id: formId }} to="/forms/$id/submissions">
					<Eye className="mr-2 h-4 w-4" />
					View Submissions
				</Link>
			</Button>
			<Button asChild size="sm" variant="outline">
				<Link params={{ id: formId }} to="/forms/$id/timeline">
					<Clock className="mr-2 h-4 w-4" />
					Timeline
				</Link>
			</Button>
		</div>
	)
}
