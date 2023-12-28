import os
from typing import Annotated
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Response, Depends, HTTPException, status
from fastapi.param_functions import Form
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from mod.database import get_db, users_table, refresh_tokens_table
from databases import Database
from asyncpg.exceptions import UniqueViolationError

ACCESS_TOKEN_SECRET_KEY = os.getenv("ACCESS_TOKEN_JWT_SECRET_KEY")
REFRESH_TOKEN_SECRET_KEY = os.getenv("REFRESH_TOKEN_JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

postgresDatabase = get_db("postgres")


class RegisterForm:
    def __init__(
        self,
        *,
        username: Annotated[str, Form()],
        password: Annotated[str, Form()],
        full_name: Annotated[str, Form()],
        email: Annotated[str, Form()],
    ):
        self.username = username
        self.password = password
        self.full_name = full_name
        self.email = email


class TokenData(BaseModel):
    username: str = None


class UserIn(BaseModel):
    username: str
    password: str
    email: str
    full_name: str


class UserOut(BaseModel):
    username: str
    email: str
    full_name: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

no_refresh_token_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No refresh_token cookie",
    headers={"WWW-Authenticate": "Bearer"},
)

invalid_refresh_token_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid refresh_token",
    headers={"WWW-Authenticate": "Bearer", "set-cookie": "refresh_token=''"},
)

not_authenticated_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)

duplicate_refresh_token_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Duplicate Refresh Token Usage",
)

refresh_token_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Unexpected Refresh Token Exception",
)


def decode_refresh_token(token: str):
    return jwt.decode(token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])


def decode_access_token(token: str):
    return jwt.decode(token, ACCESS_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def get_user(db: Database, username: str):
    query = users_table.select().where(users_table.c.username == username)
    user = await db.fetch_one(query)
    return user


async def store_refresh_token(db: Database, username: str, token: str):
    query = refresh_tokens_table.insert().values(username=username, token=token)
    id = await db.execute(
        query
    )  # may raise a unique key constraint error, in this case a refresh token has been used twice!! -> revoke all existing
    return id


## use a token secret on a "per-user" basis -> each user has an own secret to sign JWTs
# revoke all current tokens means, changing the user secret
# generate the user secret with: username + GLOBAL secret + random value -> unique hash


async def create_user(db: Database, user_in: UserIn):
    try:
        hashed_password = get_password_hash(user_in.password)
        query = users_table.insert().values(
            username=user_in.username,
            full_name=user_in.full_name,
            email=user_in.email,
            hashed_password=hashed_password,
        )
        user_id = await db.execute(query)
        return user_id
    except Exception as e:
        if isinstance(e, UniqueViolationError):
            return False
        else:
            print(f"{e}")
            return False


async def authenticate_user(db: Database, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta = None):
    return create_jwt_token(
        data=data, secret=ACCESS_TOKEN_SECRET_KEY, expires_delta=expires_delta
    )


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    return create_jwt_token(
        data=data, secret=REFRESH_TOKEN_SECRET_KEY, expires_delta=expires_delta
    )


def create_jwt_token(data: dict, secret, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt


def is_authenticated(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)
        expiration: str = payload.get("exp")
        expiration: datetime = payload.get("exp")
        if datetime.utcnow() > datetime.fromtimestamp(expiration):
            print("ACCESS_TOKEN EXPIRED")
            raise not_authenticated_exception
        username: str = payload.get("sub")
        if username is None:
            raise not_authenticated_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise not_authenticated_exception


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(postgresDatabase, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def create_token_response(username: str, response: Response):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": username}, expires_delta=refresh_token_expires
    )

    store_refresh_token_query = refresh_tokens_table.insert().values(
        username=username, token=refresh_token
    )
    await postgresDatabase.execute(store_refresh_token_query)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        samesite="strict",
        httponly=True,
        expires=refresh_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


async def login_for_tokens(
    response: Response, form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await authenticate_user(
        postgresDatabase, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await create_token_response(user["username"], response)


async def register(response: Response, form_data: RegisterForm = Depends()):
    new_user_id = await create_user(
        postgresDatabase,
        UserIn(
            username=form_data.username,
            password=form_data.password,
            full_name=form_data.full_name,
            email=form_data.email,
        ),
    )

    if new_user_id == False:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists, login with your email.",
        )

    return await create_token_response(form_data.username, response)


async def delete_all_active_refresh_tokens_from_user(username: str):
    delete_all_tokens_from_user_query = refresh_tokens_table.delete().where(
        refresh_tokens_table.c.username == username
    )

    await postgresDatabase.execute_many(delete_all_tokens_from_user_query)


def delete_refresh_cookie(response: Response):
    response.set_cookie(
        key="refresh_token",
        value="",
    )


async def refresh_access_token(refresh_token, response: Response):
    if refresh_token is None:
        raise no_refresh_token_exception
    try:
        payload = decode_refresh_token(refresh_token)
        username: str = payload.get("sub")

        delete_query = refresh_tokens_table.delete().where(
            (refresh_tokens_table.c.username == username)
            & (refresh_tokens_table.c.token == refresh_token)
        )
        # 1. delete the incoming refresh_token from the table refresh_tokens_table -> if error -> invalid token exception
        await postgresDatabase.execute(delete_query)

        # 2. store newly generated refresh_token here
        return await create_token_response(username=username, response=response)
    except JWTError:
        await delete_all_active_refresh_tokens_from_user(username=username)
        delete_refresh_cookie(response=response)
        raise invalid_refresh_token_exception
    except UniqueViolationError:
        await delete_all_active_refresh_tokens_from_user(username=username)
        delete_refresh_cookie(response=response)
        raise duplicate_refresh_token_exception
    except Exception as e:
        print(f"an unexpected exception occurred in refresh_access_token func\n{e}")
        print(type(e))
        await delete_all_active_refresh_tokens_from_user(username=username)
        delete_refresh_cookie(response=response)
        raise refresh_token_exception
