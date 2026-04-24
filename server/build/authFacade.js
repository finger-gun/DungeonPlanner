import { ConvexHttpClient } from 'convex/browser';
const DEFAULT_CONVEX_URL = 'http://127.0.0.1:3210';
const AUTH_TOKEN_COOKIE_BASENAME = '__convexAuthJWT';
const AUTH_REFRESH_COOKIE_BASENAME = '__convexAuthRefreshToken';
const AUTH_VERIFIER_COOKIE_BASENAME = '__convexAuthOAuthVerifier';
function getConvexDeploymentUrl() {
    return (process.env.CONVEX_SELF_HOSTED_URL ??
        process.env.NEXT_PUBLIC_CONVEX_URL ??
        process.env.VITE_CONVEX_URL ??
        DEFAULT_CONVEX_URL);
}
function createConvexClient(token) {
    const client = new ConvexHttpClient(getConvexDeploymentUrl());
    if (token) {
        client.setAuth(token);
    }
    return client;
}
function isLocalHost(host) {
    const hostname = host.split(':')[0]?.trim().toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
function getCookieNames(host) {
    const prefix = isLocalHost(host) ? '' : '__Host-';
    return {
        token: `${prefix}${AUTH_TOKEN_COOKIE_BASENAME}`,
        refreshToken: `${prefix}${AUTH_REFRESH_COOKIE_BASENAME}`,
        verifier: `${prefix}${AUTH_VERIFIER_COOKIE_BASENAME}`,
    };
}
function parseCookies(cookieHeader) {
    if (!cookieHeader) {
        return new Map();
    }
    return new Map(cookieHeader
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex === -1) {
            return [entry, ''];
        }
        const name = entry.slice(0, separatorIndex).trim();
        const value = entry.slice(separatorIndex + 1).trim();
        return [name, decodeURIComponent(value)];
    }));
}
export function readAuthCookies(request) {
    const names = getCookieNames(request.headers.host ?? '');
    const cookies = parseCookies(request.headers.cookie);
    return {
        token: cookies.get(names.token) ?? null,
        refreshToken: cookies.get(names.refreshToken) ?? null,
    };
}
function serializeCookie(host, name, value, maxAgeSeconds) {
    const parts = [
        `${name}=${encodeURIComponent(value)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
    ];
    if (!isLocalHost(host)) {
        parts.push('Secure');
    }
    if (maxAgeSeconds !== undefined) {
        parts.push(`Max-Age=${maxAgeSeconds}`);
    }
    return parts.join('; ');
}
function buildAuthCookieHeaders(host, tokens) {
    const names = getCookieNames(host);
    if (tokens === null) {
        return [
            serializeCookie(host, names.token, '', 0),
            serializeCookie(host, names.refreshToken, '', 0),
            serializeCookie(host, names.verifier, '', 0),
        ];
    }
    return [
        serializeCookie(host, names.token, tokens.token),
        serializeCookie(host, names.refreshToken, tokens.refreshToken),
        serializeCookie(host, names.verifier, '', 0),
    ];
}
export function applyAuthCookies(response, request, tokens) {
    response.setHeader('Set-Cookie', buildAuthCookieHeaders(request.headers.host ?? '', tokens));
}
function isAuthFlow(value) {
    return value === 'signIn' || value === 'signUp';
}
function validateSignInBody(body) {
    const request = body;
    const params = request?.params;
    if (request?.provider !== 'password' || typeof params?.email !== 'string' || typeof params.password !== 'string' || !isAuthFlow(params.flow)) {
        throw new Error('A valid password auth request is required.');
    }
    return {
        provider: 'password',
        params: {
            email: params.email,
            password: params.password,
            flow: params.flow,
            ...(typeof params.name === 'string' && params.name.trim() ? { name: params.name } : {}),
        },
    };
}
async function runAuthSignIn(args) {
    return createConvexClient().action('auth:signIn', args);
}
async function runAuthSignOut(token) {
    await createConvexClient(token).action('auth:signOut', {});
}
async function validateViewerToken(token) {
    await createConvexClient(token).query('users:viewer', {});
}
async function ensureAccessToken(cookies, forceRefreshToken) {
    if (!forceRefreshToken && cookies.token) {
        return { token: cookies.token };
    }
    if (!cookies.refreshToken) {
        return {
            token: null,
            ...(cookies.token ? { cookiesToWrite: null } : {}),
        };
    }
    try {
        const result = await runAuthSignIn({
            refreshToken: cookies.refreshToken,
        });
        const tokens = result.tokens;
        if (!('tokens' in result) || tokens === null || tokens === undefined) {
            return { token: null, cookiesToWrite: null };
        }
        return {
            token: tokens.token,
            cookiesToWrite: tokens,
        };
    }
    catch {
        return { token: null, cookiesToWrite: null };
    }
}
async function resolveSession(cookies) {
    const resolvedToken = await ensureAccessToken(cookies, false);
    if (!resolvedToken.token) {
        return {
            isAuthenticated: false,
            ...(resolvedToken.cookiesToWrite !== undefined ? { cookiesToWrite: resolvedToken.cookiesToWrite } : {}),
        };
    }
    try {
        await validateViewerToken(resolvedToken.token);
        return {
            isAuthenticated: true,
            ...(resolvedToken.cookiesToWrite !== undefined ? { cookiesToWrite: resolvedToken.cookiesToWrite } : {}),
        };
    }
    catch {
        const refreshedToken = await ensureAccessToken(cookies, true);
        if (!refreshedToken.token) {
            return { isAuthenticated: false, cookiesToWrite: null };
        }
        try {
            await validateViewerToken(refreshedToken.token);
            return {
                isAuthenticated: true,
                ...(refreshedToken.cookiesToWrite !== undefined ? { cookiesToWrite: refreshedToken.cookiesToWrite } : {}),
            };
        }
        catch {
            return { isAuthenticated: false, cookiesToWrite: null };
        }
    }
}
export async function resolveRequestAccessToken(request, response, forceRefreshToken = false) {
    const resolved = await ensureAccessToken(readAuthCookies(request), forceRefreshToken);
    if (resolved.cookiesToWrite !== undefined) {
        applyAuthCookies(response, request, resolved.cookiesToWrite);
    }
    return resolved.token;
}
function sendAuthError(response, error, status = 400) {
    response.status(status).json({
        error: error instanceof Error ? error.message : 'Authentication request failed.',
    });
}
export function registerAuthFacadeRoutes(app) {
    app.get('/api/auth/session', async (request, response) => {
        const session = await resolveSession(readAuthCookies(request));
        if (session.cookiesToWrite !== undefined) {
            applyAuthCookies(response, request, session.cookiesToWrite);
        }
        response.json({
            isAuthenticated: session.isAuthenticated,
        });
    });
    app.post('/api/auth/sign-in', async (request, response) => {
        let signInRequest;
        try {
            signInRequest = validateSignInBody(request.body);
        }
        catch (error) {
            sendAuthError(response, error, 400);
            return;
        }
        try {
            const result = await runAuthSignIn(signInRequest);
            const tokens = result.tokens;
            if (result.redirect) {
                sendAuthError(response, 'Interactive auth redirects are not supported by this backend facade.', 501);
                return;
            }
            if (!('tokens' in result) || tokens === null || tokens === undefined) {
                applyAuthCookies(response, request, null);
                sendAuthError(response, 'Sign-in failed.', 401);
                return;
            }
            applyAuthCookies(response, request, tokens);
            response.json({
                isAuthenticated: true,
            });
        }
        catch (error) {
            applyAuthCookies(response, request, null);
            sendAuthError(response, error, 400);
        }
    });
    app.post('/api/auth/sign-out', async (request, response) => {
        const cookies = readAuthCookies(request);
        try {
            if (cookies.token) {
                await runAuthSignOut(cookies.token);
            }
        }
        catch {
            // If the backend session is already gone we still want to clear local cookies.
        }
        applyAuthCookies(response, request, null);
        response.json({
            isAuthenticated: false,
        });
    });
    app.post('/api/auth/token', async (request, response) => {
        const body = (request.body ?? {});
        const cookies = readAuthCookies(request);
        const token = await ensureAccessToken(cookies, body.forceRefreshToken === true || !cookies.token);
        if (token.cookiesToWrite !== undefined) {
            applyAuthCookies(response, request, token.cookiesToWrite);
        }
        response.json({
            isAuthenticated: token.token !== null,
            token: token.token,
        });
    });
}
