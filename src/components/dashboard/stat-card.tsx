import { Skeleton } from '~/components/ui/skeleton'

interface StatCardProps {
	label: string
	value?: number
	isLoading?: boolean
}

export function StatCard({ label, value, isLoading }: StatCardProps) {
	return (
		<div className="rounded-lg border bg-white p-6">
			<div className="text-sm font-medium text-gray-600">{label}</div>
			{isLoading ? (
				<Skeleton className="h-8 w-20 mt-2" />
			) : (
				<div className="text-3xl font-bold mt-2">{value ?? 0}</div>
			)}
		</div>
	)
}
