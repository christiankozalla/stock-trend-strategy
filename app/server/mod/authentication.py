import os
from typing import Annotated
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Response, Depends, HTTPException, status
from fastapi.param_functions import Form
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from mod.database import postgresDatabase, users_table
from databases import Database
from asyncpg import UniqueViolationError



SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class RegisterForm:
    def __init__(
        self,
        *,
        username: Annotated[str, Form()],
        password: Annotated[str, Form()],
        full_name: Annotated[str, Form()],
        email: Annotated[str, Form()]
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

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(db: Database, username: str):
    query = users_table.select().where(users_table.c.username == username)
    user = await db.fetch_one(query)
    return user
        

async def create_user(db: Database, user_in: UserIn):
    try:
        hashed_password = get_password_hash(user_in.password)
        query = users_table.insert().values(
            username=user_in.username,
            full_name=user_in.full_name,
            email=user_in.email,
            hashed_password=hashed_password
        )
        user_id = await db.execute(query)
        return user_id
    except Exception as e:
        assert isinstance(e, UniqueViolationError)
        return False


async def authenticate_user(db: Database, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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

def create_token_response(username: str, response: Response):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    response.set_cookie(key="access_token", value=access_token, samesite="strict", httponly=True)
    return {"access_token": access_token, "token_type": "bearer"}

async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(postgresDatabase, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return create_token_response(user["username"], response)


async def register(response: Response, form_data: RegisterForm = Depends()):
    new_user_id = await create_user(postgresDatabase, UserIn(
        username=form_data.username,
        password=form_data.password,
        full_name=form_data.full_name,
        email=form_data.email
    ))

    if new_user_id == False:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists, login with your email.")

    return create_token_response(form_data.username, response)
