import React, { createContext, useState } from "react";

export type AuthInitProps = {
    access_token: string;
    token_type: 'bearer';
};

type TokenPayload = { sub: string; exp: number };
export type SetAuth = React.Dispatch<React.SetStateAction<Auth | null>>;

export class Auth {
    accessToken?: string;
    accessTokenType?: string;

    constructor(props: AuthInitProps) {
        this.accessToken = props.access_token;
        this.accessTokenType = props.token_type;
    }

    get hasAccessToken(): boolean {
        return Boolean(this.accessToken);
    }

    get isAccessTokenExpired(): boolean {
        const exp = this.#tokenPayload?.exp
        return (
            typeof exp === 'number'
            && Date.now() > (exp * 1000)
        );
    }

    get username() {
        return this.#tokenPayload?.sub;
    }

    get #tokenPayload(): TokenPayload | void {
        if (typeof this.accessToken !== 'string') return;
        try {
            return JSON.parse(atob(this.accessToken.split(".")[1]));
        } catch (e) {
            console.warn("Unable to decode or parse auth token payload", e);
        }
    }
}

export const AuthContext = createContext<{
    auth: Auth | null,
    setAuth: SetAuth,
}>({ auth: null, setAuth: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [auth, setAuth] = useState<Auth | null>(null);
    return <AuthContext.Provider value={{ auth, setAuth }}>{children}</AuthContext.Provider>;
}
