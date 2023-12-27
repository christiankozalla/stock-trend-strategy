import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const navigate = useNavigate();

export async function useFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response | void> {
    const authContext = useContext(AuthContext);
    try {
        init = { ...init, credentials: import.meta.env.PROD ? 'same-origin' : 'include' };
        const originalResponse = await globalThis.fetch(input, init)

        if (originalResponse.status === 401) {
            const accessTokenResponse = await getNewAccessToken();
            if (accessTokenResponse) {
                authContext.setAccessToken(await accessTokenResponse.json());
                return globalThis.fetch(input, init);
            }
        }

        return originalResponse;
    } catch (e) {
        navigate("/error");
    }
}


async function getNewAccessToken(): Promise<Response | void> {
    const response = await globalThis.fetch(`${import.meta.env.VITE_BACKEND_URL}/api/refresh-token`, {
        credentials: import.meta.env.PROD ? 'same-origin' : 'include'
    });

    if (response.status === 401) {
        navigate("/log-in");
        return;
    }

    return response;
}