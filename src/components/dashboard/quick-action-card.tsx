import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

interface QuickActionCardProps {
	label: string
	description: string
	icon: React.ReactNode
	to: string
}

export function QuickActionCard({
	label,
	description,
	icon,
	to
}: QuickActionCardProps) {
	return (
		<Link
			className="group rounded-lg border bg-white p-6 hover:border-gray-400 hover:shadow-sm transition-all block"
			to={to}
		>
			<div className="flex items-start gap-4">
				<div className="rounded-lg bg-gray-50 p-3 group-hover:bg-gray-100 transition-colors">
					{icon}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
						{label}
					</h3>
					<p className="text-sm text-gray-500 mt-1">{description}</p>
				</div>
				<ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
			</div>
		</Link>
	)
}
