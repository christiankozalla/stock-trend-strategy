from typing import List

# import os
import databases
import sqlalchemy
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

# db_username = os.getenv('POSTGRES_USER')
# db_password = os.getenv('POSTGRES_PASSWORD')
# db_name = os.getenv('POSTGRES_DB')

# Connect to SQLite database, that the deno worker fills with Signals
SQLITE_DB_URL = "sqlite:///../data/application.db"
database = databases.Database(SQLITE_DB_URL)

metadata = sqlalchemy.MetaData()

signals_table = sqlalchemy.Table(
    "signals_alpaca",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("symbol", sqlalchemy.String),
    sqlalchemy.Column("date", sqlalchemy.String),
    sqlalchemy.Column("open", sqlalchemy.Float),
    sqlalchemy.Column("stop", sqlalchemy.Float),
)

engine = sqlalchemy.create_engine(SQLITE_DB_URL,  connect_args={"check_same_thread": False})

metadata.create_all(bind=engine, checkfirst=True) # does not re-create tables that already exist

class Signal(BaseModel):
    id: int
    symbol: str
    date: str
    open: float
    stop: float

app = FastAPI()

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

app.mount("/api/series", StaticFiles(directory="series"), name="series")

@app.get("/api/signals", response_model=List[Signal])
async def get_signals_by_date(date: str):
    query = signals_table.select().where(signals_table.c.date == date)
    return await database.fetch_all(query)

@app.get("/api/signals/{symbol}", response_model=List[Signal])
async def get_signals_by_symbol(symbol: str):
    query = signals_table.select().where(signals_table.c.symbol == symbol.upper())
    return await database.fetch_all(query)