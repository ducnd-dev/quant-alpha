import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Database settings
DB_USER = os.getenv("POSTGRES_USER", "alpha_quant")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "alpha_quant_password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "alpha_quant")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Redis settings
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# API settings
API_V1_PREFIX = "/api/v1"