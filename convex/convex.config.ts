import agent from '@convex-dev/agent/convex.config'
import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config'
import resend from '@convex-dev/resend/convex.config'
import { defineApp } from 'convex/server'

const app = defineApp()
app.use(resend)
app.use(persistentTextStreaming)
app.use(agent)

export default app
