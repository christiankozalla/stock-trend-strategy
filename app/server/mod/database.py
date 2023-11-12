import databases
import sqlalchemy

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
