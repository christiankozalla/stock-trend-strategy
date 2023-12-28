import { auth } from "../../context/AuthContext";

export async function useFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response | void> {
    try {
        setAccessTokenHeader(init);
        const originalResponse = await fetch(input, init);

        if (originalResponse.status === 401) {
            const accessTokenResponse = await getNewAccessToken();
            if (accessTokenResponse.status == 401) {
                window.location.assign("/log-in");
            } else {
                auth.setAccessToken(await accessTokenResponse.json());
                setAccessTokenHeader(init);
                return fetch(input, init);
            }
        }

        return originalResponse;
    } catch (e) {
        console.error("[useFetch] error: ", (e as Error).message);
        console.log(JSON.stringify(e))
    }
}


function getNewAccessToken(): Promise<Response> {
    return globalThis.fetch("/api/refresh-token", {
        credentials: 'same-origin'
    });
}

function setAccessTokenHeader(init: RequestInit) {
    init.headers = { ...(init.headers || {}), Authorization: `Bearer ${auth.accessToken}` };
}