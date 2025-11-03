import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_platform/{-$slug}/')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/"!</div>
}
