import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
	onPrevious: () => void
	onNext: () => void
	hasPrevious: boolean
	hasNext: boolean
	className?: string
}

export function Pagination({
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
	className
}: PaginationProps) {
	return (
		<div className={className}>
			<Button
				disabled={!hasPrevious}
				onClick={onPrevious}
				size="sm"
				variant="outline"
			>
				<ChevronLeft className="h-4 w-4 mr-1" />
				Previous
			</Button>
			<Button disabled={!hasNext} onClick={onNext} size="sm" variant="outline">
				Next
				<ChevronRight className="h-4 w-4 ml-1" />
			</Button>
		</div>
	)
}
