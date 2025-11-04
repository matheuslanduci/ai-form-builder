import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_platform/{-$slug}/forms/$id/timeline')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/_platform/-$slug/forms/$id/timeline"!</div>
}
