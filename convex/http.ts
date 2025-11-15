import { httpRouter } from 'convex/server'
import { streamAIResponse } from './aiFormBuilder'
import { handleClerkWebhook } from './clerk'
import { exportToCSV } from './formSubmission'

const http = httpRouter()

http.route({
	handler: handleClerkWebhook,
	method: 'POST',
	path: '/clerk/webhook'
})

// Handle OPTIONS preflight for AI stream endpoint
http.route({
	handler: streamAIResponse,
	method: 'OPTIONS',
	path: '/ai-stream'
})

http.route({
	handler: streamAIResponse,
	method: 'POST',
	path: '/ai-stream'
})

// CSV export endpoint
http.route({
	handler: exportToCSV,
	method: 'GET',
	path: '/export-csv'
})

export default http
