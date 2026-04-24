import express from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { resolveRequestAccessToken } from './authFacade.js';
const DEFAULT_CONVEX_URL = 'http://127.0.0.1:3210';
const DEFAULT_CONVEX_SITE_URL = 'http://127.0.0.1:3211';
function getConvexDeploymentUrl() {
    return (process.env.CONVEX_SELF_HOSTED_URL ??
        process.env.NEXT_PUBLIC_CONVEX_URL ??
        process.env.VITE_CONVEX_URL ??
        DEFAULT_CONVEX_URL);
}
function getConvexSiteUrl() {
    return process.env.CONVEX_SITE_URL ?? DEFAULT_CONVEX_SITE_URL;
}
function createConvexClient(token) {
    const client = new ConvexHttpClient(getConvexDeploymentUrl());
    client.setAuth(token);
    return client;
}
function sendApiError(response, error, status = 400) {
    response.status(status).json({
        error: error instanceof Error ? error.message : 'Backend request failed.',
    });
}
function normalizeFunctionCall(body) {
    const request = body;
    if (typeof request?.name !== 'string' || !request.name.trim()) {
        throw new Error('A valid function name is required.');
    }
    if (request.args !== undefined && (typeof request.args !== 'object' || request.args === null || Array.isArray(request.args))) {
        throw new Error('Function args must be an object when provided.');
    }
    return {
        name: request.name,
        args: (request.args ?? {}),
    };
}
async function proxyConvexSiteRequest(path, body) {
    const response = await fetch(new URL(path, `${getConvexSiteUrl()}/`), {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        let errorMessage = 'Backend request failed.';
        try {
            const errorBody = (await response.json());
            if (errorBody.error) {
                errorMessage = errorBody.error;
            }
        }
        catch {
            // Keep the fallback when Convex returns non-JSON.
        }
        throw new Error(errorMessage);
    }
    return response.json();
}
async function withAuthenticatedConvexClient(request, response) {
    const token = await resolveRequestAccessToken(request, response);
    if (!token) {
        sendApiError(response, 'Authentication required.', 401);
        return null;
    }
    return createConvexClient(token);
}
function shouldRetryWithFreshToken(error) {
    return error instanceof Error && error.message.includes('UNAUTHENTICATED');
}
export function registerAppFacadeRoutes(app) {
    app.post('/api/app/query', async (request, response) => {
        const client = await withAuthenticatedConvexClient(request, response);
        if (!client) {
            return;
        }
        let call;
        try {
            call = normalizeFunctionCall(request.body);
        }
        catch (error) {
            sendApiError(response, error, 400);
            return;
        }
        try {
            const value = await client.query(call.name, call.args);
            response.json({ value });
        }
        catch (error) {
            if (shouldRetryWithFreshToken(error)) {
                const token = await resolveRequestAccessToken(request, response, true);
                if (!token) {
                    sendApiError(response, 'Authentication required.', 401);
                    return;
                }
                try {
                    const value = await createConvexClient(token).query(call.name, call.args);
                    response.json({ value });
                    return;
                }
                catch (retryError) {
                    sendApiError(response, retryError, 400);
                    return;
                }
            }
            sendApiError(response, error, 400);
        }
    });
    app.post('/api/app/mutation', async (request, response) => {
        const client = await withAuthenticatedConvexClient(request, response);
        if (!client) {
            return;
        }
        let call;
        try {
            call = normalizeFunctionCall(request.body);
        }
        catch (error) {
            sendApiError(response, error, 400);
            return;
        }
        try {
            const value = await client.mutation(call.name, call.args);
            response.json({ value });
        }
        catch (error) {
            if (shouldRetryWithFreshToken(error)) {
                const token = await resolveRequestAccessToken(request, response, true);
                if (!token) {
                    sendApiError(response, 'Authentication required.', 401);
                    return;
                }
                try {
                    const value = await createConvexClient(token).mutation(call.name, call.args);
                    response.json({ value });
                    return;
                }
                catch (retryError) {
                    sendApiError(response, retryError, 400);
                    return;
                }
            }
            sendApiError(response, error, 400);
        }
    });
    app.post('/api/app/storage/upload', express.raw({ type: '*/*', limit: '50mb' }), async (request, response) => {
        const client = await withAuthenticatedConvexClient(request, response);
        if (!client) {
            return;
        }
        const body = request.body;
        if (!(body instanceof Buffer) || body.length === 0) {
            sendApiError(response, 'A file payload is required.', 400);
            return;
        }
        try {
            const uploadUrl = await client.mutation('packs:generatePackUploadUrl', {});
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': request.header('content-type') ?? 'application/octet-stream',
                },
                body,
            });
            if (!uploadResponse.ok) {
                throw new Error('Pack file upload failed.');
            }
            const payload = (await uploadResponse.json());
            response.json(payload);
        }
        catch (error) {
            sendApiError(response, error, 502);
        }
    });
    app.post('/editor-dungeons/list', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/editor-dungeons/list', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
    app.post('/editor-dungeons/open', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/editor-dungeons/open', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
    app.post('/editor-dungeons/save', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/editor-dungeons/save', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
    app.post('/editor-dungeons/copy', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/editor-dungeons/copy', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
    app.post('/editor-dungeons/delete', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/editor-dungeons/delete', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
    app.post('/session-access/consume', async (request, response) => {
        try {
            response.json(await proxyConvexSiteRequest('/session-access/consume', request.body));
        }
        catch (error) {
            sendApiError(response, error, 400);
        }
    });
}
