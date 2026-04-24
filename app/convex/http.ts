import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: '/session-access/consume',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      sessionId?: string
      accessToken?: string
    }

    if (!body.sessionId || !body.accessToken) {
      return Response.json({ error: 'sessionId and accessToken are required.' }, { status: 400 })
    }

    try {
      const access = await ctx.runMutation(internal.sessions.consumeServerAccessTicket, {
        sessionId: body.sessionId as never,
        accessToken: body.accessToken,
      })

      return Response.json(access)
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Session access denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeon/consume',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      dungeonId?: string
      accessToken?: string
    }

    if (!body.dungeonId || !body.accessToken) {
      return Response.json({ error: 'dungeonId and accessToken are required.' }, { status: 400 })
    }

    try {
      const dungeon = await ctx.runMutation(internal.dungeons.consumeEditorAccessTicket, {
        dungeonId: body.dungeonId as never,
        accessToken: body.accessToken,
      })

      return Response.json(dungeon)
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Dungeon access denied.' },
        { status: 403 },
      )
    }
  }),
})

export default http
