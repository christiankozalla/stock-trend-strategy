import os
import databases
import sqlalchemy
from sqlalchemy.dialects import sqlite, postgresql
from pydantic import BaseModel

db_username = os.getenv('POSTGRES_USER')
db_password = os.getenv('POSTGRES_PASSWORD')
db_name = os.getenv('POSTGRES_DB')


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

# sqliteEngine = sqlalchemy.create_engine(SQLITE_DB_URL,  connect_args={"check_same_thread": False})
# sqliteMetadata.create_all(bind=sqliteEngine, checkfirst=True) # does not re-create tables that already exist

async def create_sqlite_tables():
        # Create tables
    dialect = sqlite.dialect()
    for table in sqliteMetadata.tables.values():
        # Set `if_not_exists=False` if you want the query to throw an
        # exception when the table already exists
        schema = sqlalchemy.schema.CreateTable(table, if_not_exists=True)
        query = str(schema.compile(dialect=dialect))
        await postgresDatabase.execute(query=query)

# Postgres
POSTGRES_DB_URL = f"postgresql+asyncpg://{db_username}:{db_password}@localhost:5432/{db_name}"

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
    sqlalchemy.Column("full_name", sqlalchemy.String)
)

class User(BaseModel):
    id: int
    username: str
    hashed_password: str
    email: str
    full_name: str


# postgresEngine = sqlalchemy.create_engine(POSTGRES_DB_URL)
# postgresMetadata.create_all(bind=postgresEngine, checkfirst=True) # does not re-create tables that already exist
async def create_postgres_tables():
        # Create tables
    dialect = postgresql.dialect()
    for table in postgresMetadata.tables.values():
        schema = sqlalchemy.schema.CreateTable(table, if_not_exists=True)
        query = str(schema.compile(dialect=dialect))
        await postgresDatabase.execute(query=query)