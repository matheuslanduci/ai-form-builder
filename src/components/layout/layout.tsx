import { AppHeader } from './app-header'

export function Layout({ title, children }: LayoutProps) {
	return (
		<>
			<AppHeader title={title} />

			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						{children}
					</div>
				</div>
			</div>
		</>
	)
}

type LayoutProps = {
	title: string
	children: React.ReactNode
}
