import os
from typing import Literal
import databases
import sqlalchemy
from sqlalchemy import select, and_
from sqlalchemy.dialects import sqlite, postgresql
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

db_username = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASSWORD")
db_name = os.getenv("POSTGRES_DB")


# Connect to SQLite database, that the deno worker fills with Signals
SQLITE_DB_URL = "sqlite+aiosqlite:///../data/application.db"

sqliteDatabase = databases.Database(SQLITE_DB_URL)

sqliteMetadata = sqlalchemy.MetaData()

signals_table = sqlalchemy.Table(
    "signals_alpaca",
    sqliteMetadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("symbol", sqlalchemy.String),
    sqlalchemy.Column("date", sqlalchemy.String),
    sqlalchemy.Column("open", sqlalchemy.Float),
    sqlalchemy.Column("stop", sqlalchemy.Float),
)

daily_change_table = sqlalchemy.Table(
    'daily_change',
    sqliteMetadata,
    sqlalchemy.Column('id', sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column('date', sqlalchemy.Date, nullable=False),
    sqlalchemy.Column('symbol', sqlalchemy.String, nullable=False),
    sqlalchemy.Column('open', sqlalchemy.Float, nullable=False),
    sqlalchemy.Column('close', sqlalchemy.Float, nullable=False),
    sqlalchemy.Column('previousClose', sqlalchemy.Float, nullable=False),
    sqlalchemy.Index('idx_date', 'date'),
    sqlalchemy.Index('idx_symbol', 'symbol'),
    sqlalchemy.UniqueConstraint('symbol', 'date', name='uq_symbol_date', sqlite_on_conflict='IGNORE')  # Handle uniqueness with conflict policy
)

# sqliteEngine = sqlalchemy.create_engine(SQLITE_DB_URL,  connect_args={"check_same_thread": False})
# sqliteMetadata.create_all(bind=sqliteEngine, checkfirst=True) # does not re-create tables that already exist


async def create_sqlite_tables():
    try:
        # Create tables
        dialect = sqlite.dialect()
        for table in sqliteMetadata.tables.values():
            print(f"Creating table {table}")
            # Set `if_not_exists=False` if you want the query to throw an
            # exception when the table already exists
            schema = sqlalchemy.schema.CreateTable(table, if_not_exists=True)
            query = str(schema.compile(dialect=dialect))
            await get_db("sqlite").execute(query=query)
    except Exception as e:
        print(str(e))


# Postgres
POSTGRES_DB_URL = (
    f"postgresql+asyncpg://{db_username}:{db_password}@localhost:5432/{db_name}"
)

postgresDatabase = databases.Database(POSTGRES_DB_URL)
postgresMetadata = sqlalchemy.MetaData()

# Postgres Tables
users_table = sqlalchemy.Table(
    "users",
    postgresMetadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String, unique=True),
    sqlalchemy.Column("hashed_password", sqlalchemy.String),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True),
    sqlalchemy.Column("full_name", sqlalchemy.String),
)


class User(BaseModel):
    id: int
    username: str
    hashed_password: str
    email: str
    full_name: str


# table stores the currently active refresh_tokens for a username
# the process of exchanging a refresh_token for an access_token is two-fold:
# 1. delete the incoming refresh_token from this table -> if error -> invalid token exception
# 2. store newly generated refresh_token here
refresh_tokens_table = sqlalchemy.Table(
    "refresh_tokens",
    postgresMetadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("token", sqlalchemy.String, nullable=False),
    sqlalchemy.UniqueConstraint("username", "token"),
)


class RefreshToken(BaseModel):
    id: int
    username: str
    token: str
    id: int
    username: str
    token: str


class RefreshTokenIn:
    username: str
    token: str


# postgresEngine = sqlalchemy.create_engine(POSTGRES_DB_URL)
# postgresMetadata.create_all(bind=postgresEngine, checkfirst=True) # does not re-create tables that already exist
async def create_postgres_tables():
    try:
        # Create tables
        dialect = postgresql.dialect()
        for table in postgresMetadata.tables.values():
            schema = sqlalchemy.schema.CreateTable(table, if_not_exists=True)
            query = str(schema.compile(dialect=dialect))
            await get_db("postgres").execute(query=query)
    except Exception as e:
        print(str(e))


def get_db(name: Literal["postgres", "sqlite"]):
    if name == "postgres":
        return postgresDatabase
    elif name == "sqlite":
        return sqliteDatabase
    raise ValueError("Invalid database name. Expected 'postgres' or 'sqlite'.")


sp_set = ["AAPL", "MSFT", "NVDA", "AVGO", "ADBE", "GOOG", "META", "NFLX", "DIS", "CMCSA", "AMZN", "TSLA", "HD", "NKE", "MCD", "WMT", "PG", "KO", "COST", "PEP", "UNH", "JNJ", "LLY", "ABBV", "MRK", "JPM", "V", "BAC", "MA", "WFC", "GE", "CAT", "UPS", "HON", "BA", "XOM", "CVX", "COP", "SLB", "EOG"]
nasdaq_set = ["AAPL", "MSFT", "NVDA", "ADBE", "INTC", "CSCO", "AMD", "QCOM", "TXN", "AVGO", "MU", "AMAT", "ADI", "LRCX", "KLAC", "GOOG", "META", "NFLX", "CMCSA", "TMUS", "CHTR", "ATVI", "EA", "TTD", "AMZN", "TSLA", "BKNG", "SBUX", "MAR", "LULU", "EBAY", "ROST", "DLTR", "PEP", "COST", "MDLZ", "KHC", "WBA", "GILD", "REGN", "VRTX", "ISRG", "ILMN", "ALGN", "DXCM", "PYPL", "NDAQ", "HON", "CSX", "FAST"]
async def query_daily_change(date: str, set: Literal["nasdaq", "sp"]):

    query = select(
        daily_change_table.c.close,
        daily_change_table.c.previousClose,
        daily_change_table.c.symbol
    ).where(
        and_(
            daily_change_table.c.date == date,
            daily_change_table.c.symbol.in_(sp_set if set == "sp" else nasdaq_set)
        )
    )
    results = await get_db("sqlite").fetch_all(query=query)
    return results