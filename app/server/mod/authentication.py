from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from mod.database import database

SECRET_KEY = "607e19a5d5b03af5b70a0456c511badbc5e40ca69e61dac9df32df86a4e1748c"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class TokenData(BaseModel):
    username: Optional[str] = None

class UserIn(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

class User(BaseModel):
    username: str
    hashed_password: str
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

async def get_user(db, username: str):
    user = await db.query(User).filter(User.username == username).first()
    if user:
        del user["hashed_password"]
        return user
    else:
        return False
        

async def create_user(db, user_in: UserIn):
    hashed_password = get_password_hash(user_in.password)
    new_user = User(username=user_in.username,
                    full_name=user_in.full_name,
                    email=user_in.email,
                    hashed_password=hashed_password)

    db.add(new_user)
    await db.commit()
    return new_user

async def authenticate_user(db, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
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
    user = await get_user(database, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(database, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def register(user_in: UserIn):
    new_user = await create_user(database, user_in)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}