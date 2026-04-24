const DEFAULT_CONVEX_SITE_URL = 'http://127.0.0.1:3211';
const SESSION_ACCESS_CONSUME_PATH = '/api/session-access/consume';
function buildConvexSiteUrl(path) {
    return new URL(path, `${process.env.CONVEX_SITE_URL ?? DEFAULT_CONVEX_SITE_URL}/`).toString();
}
export async function consumeSessionAccessTicket(sessionId, accessToken) {
    const response = await fetch(buildConvexSiteUrl(SESSION_ACCESS_CONSUME_PATH), {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sessionId,
            accessToken,
        }),
    });
    if (!response.ok) {
        let errorMessage = 'Session access denied.';
        try {
            const errorBody = (await response.json());
            if (errorBody.error) {
                errorMessage = errorBody.error;
            }
        }
        catch {
            // Keep the fallback message when the backend response is not JSON.
        }
        throw new Error(errorMessage);
    }
    return response.json();
}
