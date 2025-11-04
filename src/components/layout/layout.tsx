import { AppHeader } from './app-header'

export function Layout({ title, actions, children }: LayoutProps) {
	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<AppHeader actions={actions} title={title} />

			<div className="flex-1 overflow-y-auto">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 p-4 md:gap-6 md:py-6">
						{children}
					</div>
				</div>
			</div>
		</div>
	)
}

type LayoutProps = {
	title: string
	children: React.ReactNode
	actions?: React.ReactNode
}
