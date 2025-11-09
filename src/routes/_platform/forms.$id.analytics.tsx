import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ArrowDown, ArrowUp, Calendar, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card'
import { ChartContainer, ChartTooltip } from '~/components/ui/chart'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/forms/$id/analytics')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Form Analytics - AI Form Builder',
			description: 'View analytics and insights for your form'
		})
	})
})

type DateRange = '7d' | '30d' | '90d' | 'all'

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()
	const [dateRange, setDateRange] = useState<DateRange>('30d')

	const businessId = organization?.id ?? (user?.id as string)

	// Calculate date range
	const { startDate, endDate } = useMemo(() => {
		const end = Date.now()
		let start: number | undefined

		if (dateRange === '7d') {
			start = end - 7 * 24 * 60 * 60 * 1000
		} else if (dateRange === '30d') {
			start = end - 30 * 24 * 60 * 60 * 1000
		} else if (dateRange === '90d') {
			start = end - 90 * 24 * 60 * 60 * 1000
		}

		return { startDate: start, endDate: end }
	}, [dateRange])

	const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery(
		convexQuery(
			api.analytics.getSubmissionsOverTime,
			isOrgLoaded
				? {
						formId: formId as Id<'form'>,
						businessId,
						startDate,
						endDate
					}
				: 'skip'
		)
	)

	const chartConfig = {
		count: {
			label: 'Submissions',
			color: 'hsl(var(--chart-1))'
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})
	}

	if (!isOrgLoaded || isAnalyticsLoading) {
		return (
			<div className="mx-auto max-w-7xl space-y-8 p-8">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-2 h-4 w-96" />
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton className="h-32" key={i} />
					))}
				</div>
				<Skeleton className="h-96" />
			</div>
		)
	}

	const metrics = analyticsData?.metrics
	const dailyData = analyticsData?.dailyData || []

	return (
		<div className="mx-auto max-w-7xl space-y-8 p-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
					<p className="text-sm text-gray-500 mt-1">
						Track your form's performance and submission trends
					</p>
				</div>

				{/* Date Range Selector */}
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setDateRange('7d')}
						size="sm"
						variant={dateRange === '7d' ? 'default' : 'outline'}
					>
						Last 7 days
					</Button>
					<Button
						onClick={() => setDateRange('30d')}
						size="sm"
						variant={dateRange === '30d' ? 'default' : 'outline'}
					>
						Last 30 days
					</Button>
					<Button
						onClick={() => setDateRange('90d')}
						size="sm"
						variant={dateRange === '90d' ? 'default' : 'outline'}
					>
						Last 90 days
					</Button>
					<Button
						onClick={() => setDateRange('all')}
						size="sm"
						variant={dateRange === 'all' ? 'default' : 'outline'}
					>
						All time
					</Button>
				</div>
			</div>

			<Separator />

			{/* Metrics Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{/* Total Submissions */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Submissions
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{metrics?.totalSubmissions || 0}
						</div>
						{metrics?.growthPercentage !== undefined && (
							<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
								{metrics.growthPercentage >= 0 ? (
									<ArrowUp className="h-3 w-3 text-green-600" />
								) : (
									<ArrowDown className="h-3 w-3 text-red-600" />
								)}
								<span
									className={
										metrics.growthPercentage >= 0
											? 'text-green-600'
											: 'text-red-600'
									}
								>
									{Math.abs(metrics.growthPercentage)}%
								</span>
								<span>from previous period</span>
							</p>
						)}
					</CardContent>
				</Card>

				{/* Average Per Day */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Average Per Day
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{metrics?.averagePerDay || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Submissions per day
						</p>
					</CardContent>
				</Card>

				{/* Peak Day */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Peak Day</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{metrics?.peakDayCount || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{metrics?.peakDay
								? formatDate(metrics.peakDay)
								: 'No submissions yet'}
						</p>
					</CardContent>
				</Card>

				{/* Days with Activity */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Days with Activity
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{dailyData.length}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Days with submissions
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Chart Section */}
			<Card>
				<CardHeader>
					<CardTitle>Submissions Over Time</CardTitle>
					<CardDescription>
						Daily submission count for the selected period
					</CardDescription>
				</CardHeader>
				<CardContent>
					{dailyData.length > 0 ? (
						<ChartContainer className="h-[400px]" config={chartConfig}>
							<AreaChart data={dailyData}>
								<defs>
									<linearGradient id="colorCount" x1="0" x2="0" y1="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-count)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-count)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis
									dataKey="date"
									tickFormatter={formatDate}
									tickLine={false}
								/>
								<YAxis allowDecimals={false} tickLine={false} />
								<ChartTooltip
									content={({ active, payload }) => {
										if (active && payload?.[0]) {
											return (
												<div className="rounded-lg border bg-background p-2 shadow-sm">
													<div className="grid gap-2">
														<div className="flex items-center justify-between gap-2">
															<span className="text-[0.70rem] uppercase text-muted-foreground">
																{formatDate(payload[0].payload.date)}
															</span>
														</div>
														<div className="flex items-center justify-between gap-2">
															<div className="flex items-center gap-1">
																<div
																	className="h-2 w-2 rounded-full"
																	style={{
																		backgroundColor: 'var(--color-count)'
																	}}
																/>
																<span className="text-sm font-medium">
																	Submissions
																</span>
															</div>
															<span className="text-sm font-bold">
																{payload[0].value}
															</span>
														</div>
													</div>
												</div>
											)
										}
										return null
									}}
								/>
								<Area
									dataKey="count"
									fill="url(#colorCount)"
									fillOpacity={1}
									stroke="var(--color-count)"
									strokeWidth={2}
									type="monotone"
								/>
							</AreaChart>
						</ChartContainer>
					) : (
						<div className="flex h-[400px] items-center justify-center text-muted-foreground">
							No submission data available for the selected period
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
