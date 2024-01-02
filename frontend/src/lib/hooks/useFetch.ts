import { type SetAuth, Auth } from "../../context/AuthContext";
const THIRTY_SECONDS = 30;
let lastTokenRefreshCall = 0;

export function useFetch({ auth, setAuth }: {
    auth: Auth | null,
    setAuth: SetAuth,
}) {
    function setAccessTokenHeader(init: RequestInit) {
        console.log("[useFetch] setting access_token", auth?.accessToken);
        if (typeof auth?.accessToken === "string")
            init.headers = { ...(init.headers || {}), Authorization: `Bearer ${auth?.accessToken}` };
    }

    async function getNewAccessToken(): Promise<Response | void> {
        const now = Date.now();
        if ((auth !== null && auth.isAccessTokenExpired()) || (now - lastTokenRefreshCall) / 1000 > THIRTY_SECONDS) {
            console.log("[useFetch]: isAccessTokenExpired", auth?.isAccessTokenExpired());
            lastTokenRefreshCall = now;
            return fetch("/api/refresh-token", {
                credentials: "same-origin"
            });
        } else {
            return;
        }
    }

    async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response | void> {
        try {
            setAccessTokenHeader(init);
            const originalResponse = await fetch(input, init);

            if (originalResponse.status === 401) {
                const accessTokenResponse = await getNewAccessToken();
                if (!accessTokenResponse) {
                    console.log("[useFetch]: Dropped call to /api/refresh-token because of 30 seconds request timeout");
                } else if (accessTokenResponse.status === 401) {
                    window.location.assign("/log-in");
                } else if (
                    accessTokenResponse.status === 200
                    && accessTokenResponse.headers.get("Content-Type") === "application/json"
                ) {
                    setAuth(new Auth(await accessTokenResponse.json() as { access_token: string; token_type: "bearer" }));
                    setAccessTokenHeader(init);
                    return fetch(input, init);
                } else {
                    throw accessTokenResponse;
                }
            }

            return originalResponse;
        } catch (e) {
            if (e instanceof Error) {
                console.error("[useFetch] error: ", e.name, e.message, e.stack)
            } else if (e instanceof Response) {
                console.error("[useFetch] error response: ", e.status, e.statusText);
            } else {
                console.error("[useFetch] unknown error:", e);
            }

        }
    }

    return {
        fetch: fetchWithAuth,
        fetchNewAccessToken: getNewAccessToken,
    }
}
