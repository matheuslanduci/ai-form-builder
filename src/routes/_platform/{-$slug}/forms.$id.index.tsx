import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_platform/{-$slug}/forms/$id/')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<div className="p-6">
			<div className="text-center text-muted-foreground">
				Form Builder Coming Soon...
			</div>
		</div>
	)
}
