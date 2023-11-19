from typing import List, Annotated
import os
import json
from fastapi import FastAPI, Response, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from mod.database import (
    sqliteDatabase,
    postgresDatabase,
    create_postgres_tables,
    create_sqlite_tables,
    signals_table,
    User
)

from mod.authentication import (
    RegisterForm,
    register,
    get_current_user,
    login_for_access_token
)

class Signal(BaseModel):
    id: int
    symbol: str
    date: str
    open: float
    stop: float

app = FastAPI()

if os.getenv("SERVER_MODE", False) == "DEVELOPMENT":
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:4173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
async def startup():
    await sqliteDatabase.connect()
    await postgresDatabase.connect()
    await create_postgres_tables()
    await create_sqlite_tables()

@app.on_event("shutdown")
async def shutdown():
    await sqliteDatabase.disconnect()

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

@app.get("/api/trading-days")
async def get_trading_days():
    try:
        with open(file_path, "r") as file:
            trading_days_data = json.load(file)
        return trading_days_data
    except FileNotFoundError:
        return {"error": "Trading days data not found"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


@app.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], response: Response):
    return await login_for_access_token(response, form_data)

@app.get("/users/me")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_new_user(form_data: Annotated[RegisterForm, Depends()], response: Response):
    return await register(response, form_data)
