# Refresh Tokens

## Access_Token

- stored in memory (AuthContext)

## Refresh Token

- stored as HTTP-only cookie

## Endpoint GET /api/refresh-token

- Checks cookie header for valid refresh token

Case 1: No token -> 401
Case 2: Invalid refresh token -> 401 AND revoke all currently valid refresh tokens in DB
Case 3: Valid refresh token -> 200 AND return new access token and new refresh token

Refresh-Token -> JWT
Payload: { sub: "username", exp: number }

1. Check for cookie
2. Verify JWT
3. Decode JWT -> yields payload -> yields username
4. look up valid refresh-tokens for username in DB (table refresh_tokens)

## Fetch-Wrapper

### Case 1 - User has no Access Token

1. Perform original request.
    if 401 -> try to getNewAccessToken -> if 200 repeat original request with access token
    if (2xx) -> great, public ressource, no authentication needed
    else handle error

### Case 2 - User has Access Token

It could be checked in AuthContext whether Access Token has not exired yet, but we can use the same algorithm as in Case 1
This way, the Fetch-Wrapper only needs to handle one case (not three "Has valid Access Token", "Has expired Access Token", "Has no Access Token")

1. Perform original request.
    if 401 -> try to getNewAccessToken -> if 200 repeat original request with access token
    if (2xx) -> great, public ressource, no authentication needed
    else handle error




getNewAccessToken() {
    send GET /api/refresh-token with (credentials include)
        return value
        401 -> show login page
        200 -> set new access token into AuthContext (new refresh token will be set automatically via set-cookie header)
}
