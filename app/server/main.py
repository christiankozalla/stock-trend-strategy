from typing import List, Annotated
import os
import json
from fastapi import FastAPI, Response, Depends, Cookie, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from mod.database import (
    get_db,
    create_postgres_tables,
    create_sqlite_tables,
    signals_table,
    User,
)
from mod.authentication import (
    RegisterForm,
    register,
    get_current_user,
    login_for_tokens,
    refresh_access_token,
    is_authenticated,
)


class Signal(BaseModel):
    id: int
    symbol: str
    date: str
    open: float
    stop: float


sqliteDatabase = get_db("sqlite")
postgresDatabase = get_db("postgres")

app = FastAPI()


@app.on_event("startup")
async def startup():
    await get_db("sqlite").connect()
    await get_db("postgres").connect()
    await create_postgres_tables()
    await create_sqlite_tables()


@app.on_event("shutdown")
async def shutdown():
    await get_db("sqlite").disconnect()
    await get_db("postgres").disconnect()


app.mount("/api/symbols", StaticFiles(directory="series"), name="series")


@app.get("/api/signals", response_model=List[Signal])
async def get_signals_by_date(date: str):
    query = signals_table.select().where(signals_table.c.date == date)
    return await sqliteDatabase.fetch_all(query)


@app.get("/api/signals/{symbol}", response_model=List[Signal])
async def get_signals_by_symbol(symbol: str):
    query = signals_table.select().where(signals_table.c.symbol == symbol.upper())
    return await sqliteDatabase.fetch_all(query)


current_directory = os.path.dirname(os.path.realpath(__file__))

file_path = os.path.join(current_directory, "../data/trading-days.json")


@app.get("/api/trading-days", response_model=List[str])
async def get_trading_days():
    try:
        with open(file_path, "r") as file:
            trading_days_data = json.load(file)
        return trading_days_data
    except FileNotFoundError:
        return {"error": "Trading days data not found"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


@app.get("/api/users/me")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


# @app.get("/api/secured")
# def secured_route(auth_status: Annotated[bool, Depends(is_authenticated)]):
#     return {"is_authenticated": auth_status}


# Login
@app.post("/api/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response
):
    return await login_for_tokens(response=response, form_data=form_data)


# Sign Up
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register_new_user(
    form_data: Annotated[RegisterForm, Depends()], response: Response
):
    return await register(response, form_data)


# Exchange refresh_token for access_token
@app.get("/api/refresh-token")
async def refresh_access_token_handler(
    response: Response, refresh_token: Annotated[str | None, Cookie()] = None
):
    return await refresh_access_token(refresh_token, response)
