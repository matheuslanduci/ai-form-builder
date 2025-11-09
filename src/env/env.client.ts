/// <reference types="vite/client" />
import z from 'zod'

const envSchema = z.object({
	VITE_CONVEX_URL: z.url(),
	VITE_CONVEX_SITE: z.url(),
	VITE_CLERK_PUBLISHABLE_KEY: z.string()
})

export const envClient = envSchema.parse(import.meta.env)
