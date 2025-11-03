import { httpRouter } from 'convex/server'
import { handleClerkWebhook } from './clerk'

const http = httpRouter()

http.route({
	handler: handleClerkWebhook,
	method: 'POST',
	path: '/clerk/webhook'
})

export default http
