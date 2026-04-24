const DEFAULT_CONVEX_SITE_URL = 'http://127.0.0.1:3211';
export async function consumeSessionAccessTicket(sessionId, accessToken) {
    const response = await fetch(`${process.env.CONVEX_SITE_URL ?? DEFAULT_CONVEX_SITE_URL}/session-access/consume`, {
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
