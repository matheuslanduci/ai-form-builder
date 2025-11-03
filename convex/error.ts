import { ConvexError } from 'convex/values'

export function unauthorized() {
	return new ConvexError('Unauthorized')
}

export function forbidden() {
	return new ConvexError('Forbidden')
}

export function notFound() {
	return new ConvexError('Not Found')
}
