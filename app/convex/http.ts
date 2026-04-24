import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'
import {
  CROSS_ORIGIN_POST_PATHS,
  crossOriginJson,
  crossOriginPreflight,
} from './crossOriginHttp'

const http = httpRouter()

auth.addHttpRoutes(http)

for (const path of CROSS_ORIGIN_POST_PATHS) {
  http.route({
    path,
    method: 'OPTIONS',
    handler: httpAction(async () => crossOriginPreflight()),
  })
}

http.route({
  path: '/session-access/consume',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      sessionId?: string
      accessToken?: string
    }

    if (!body.sessionId || !body.accessToken) {
      return crossOriginJson({ error: 'sessionId and accessToken are required.' }, { status: 400 })
    }

    try {
      const access = await ctx.runMutation(internal.sessions.consumeServerAccessTicket, {
        sessionId: body.sessionId as never,
        accessToken: body.accessToken,
      })

      return crossOriginJson(access)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Session access denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeons/list',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      accessToken?: string
    }

    if (!body.accessToken) {
      return crossOriginJson({ error: 'accessToken is required.' }, { status: 400 })
    }

    try {
      const dungeons = await ctx.runQuery(internal.dungeons.listEditorDungeons, {
        accessToken: body.accessToken,
      })

      return crossOriginJson(dungeons)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Dungeon access denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeons/open',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      dungeonId?: string
      accessToken?: string
    }

    if (!body.dungeonId || !body.accessToken) {
      return crossOriginJson({ error: 'dungeonId and accessToken are required.' }, { status: 400 })
    }

    try {
      const dungeon = await ctx.runQuery(internal.dungeons.openEditorDungeon, {
        dungeonId: body.dungeonId as never,
        accessToken: body.accessToken,
      })

      return crossOriginJson(dungeon)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Dungeon access denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeons/save',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      accessToken?: string
      dungeonId?: string
      title?: string
      description?: string
      serializedDungeon?: string
    }

    if (!body.accessToken || !body.title || !body.serializedDungeon) {
      return crossOriginJson(
        { error: 'accessToken, title, and serializedDungeon are required.' },
        { status: 400 },
      )
    }

    try {
      const dungeon = await ctx.runMutation(internal.dungeons.saveEditorDungeon, {
        accessToken: body.accessToken,
        dungeonId: body.dungeonId as never,
        title: body.title,
        description: body.description,
        serializedDungeon: body.serializedDungeon,
      })

      return crossOriginJson(dungeon)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Dungeon save denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeons/copy',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      accessToken?: string
      dungeonId?: string
    }

    if (!body.accessToken || !body.dungeonId) {
      return crossOriginJson({ error: 'accessToken and dungeonId are required.' }, { status: 400 })
    }

    try {
      const dungeon = await ctx.runMutation(internal.dungeons.copyEditorDungeon, {
        accessToken: body.accessToken,
        dungeonId: body.dungeonId as never,
      })

      return crossOriginJson(dungeon)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Dungeon copy denied.' },
        { status: 403 },
      )
    }
  }),
})

http.route({
  path: '/editor-dungeons/delete',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      accessToken?: string
      dungeonId?: string
    }

    if (!body.accessToken || !body.dungeonId) {
      return crossOriginJson({ error: 'accessToken and dungeonId are required.' }, { status: 400 })
    }

    try {
      const result = await ctx.runMutation(internal.dungeons.deleteEditorDungeon, {
        accessToken: body.accessToken,
        dungeonId: body.dungeonId as never,
      })

      return crossOriginJson(result)
    } catch (error) {
      return crossOriginJson(
        { error: error instanceof Error ? error.message : 'Dungeon deletion denied.' },
        { status: 403 },
      )
    }
  }),
})

export default http
