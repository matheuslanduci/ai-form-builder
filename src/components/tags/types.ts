import type { Id } from 'convex/_generated/dataModel'

export type Tag = {
	_id: Id<'tag'>
	_creationTime: number
	businessId: string
	name: string
	color?: string
}
