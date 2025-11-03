import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '~/components/layout/layout'

export const Route = createFileRoute('/_platform/{-$slug}/forms')({
	component: RouteComponent
})

function RouteComponent() {
	return <Layout title="Forms">hello</Layout>
}
