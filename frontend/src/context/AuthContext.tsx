import React, { createContext } from "react";

export type AuthInitProps = {
    access_token: string;
    token_type: 'bearer';
};

type TokenPayload = { sub: string; exp: number };

export class Auth {
    accessToken?: string;
    accessTokenType?: string;

    constructor(props?: AuthInitProps) {
        this.accessToken = props?.access_token;
        this.accessTokenType = props?.token_type;
    }

    hasAccessToken(): boolean {
        return Boolean(this.accessToken);
    }

    isAccessTokenExpired(): boolean {
        const exp = this.#tokenPayload()?.exp
        return (
            typeof exp === 'number'
            && Date.now() > (exp * 1000)
        );
    }

    setAccessToken({ access_token, token_type }: AuthInitProps) {
        this.accessToken = access_token;
        this.accessTokenType = token_type;
    }

    getUsername() {
        return this.#tokenPayload()?.sub;
    }

    #tokenPayload(): TokenPayload | void {
        if (typeof this.accessToken !== 'string') return;
        try {
            return JSON.parse(atob(this.accessToken.split(".")[1]));
        } catch (e) {
            console.warn("Unable to decode or parse auth token payload", e);
        }
    }
}

export const AuthContext = createContext<Auth>(new Auth());

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={new Auth()}>{children}</AuthContext.Provider>;
}