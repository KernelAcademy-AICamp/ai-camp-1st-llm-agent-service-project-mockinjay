"""
Application Configuration
Centralized configuration management using Pydantic BaseSettings
"""
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List
import secrets


class Settings(BaseSettings):
    """Application settings with validation"""

    # MongoDB Configuration
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI"
    )
    db_name: str = Field(
        default="careguide",
        description="MongoDB database name"
    )

    # Security
    secret_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        min_length=32,
        description="Secret key for JWT token signing (minimum 32 characters)"
    )

    # CORS Settings (stored as string, parsed to list)
    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:5175",
        description="Comma-separated list of allowed CORS origins",
        alias="CORS_ORIGINS"
    )

    # Application Settings
    app_env: str = Field(
        default="development",
        description="Application environment (development/production)"
    )
    debug: bool = Field(
        default=True,
        description="Debug mode"
    )

    # OpenAI API
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins into a list"""
        if isinstance(self.cors_origins_raw, str):
            return [origin.strip() for origin in self.cors_origins_raw.split(',') if origin.strip()]
        return self.cors_origins_raw

    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v):
        """Ensure secret key is strong enough"""
        if len(v) < 32:
            raise ValueError('SECRET_KEY must be at least 32 characters long')
        if v == 'your-secret-key-here' or v == 'your-secret-key-here-min-32-characters-long':
            raise ValueError(
                'Please set a secure SECRET_KEY in your .env file. '
                'You can generate one using: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        return v

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.app_env.lower() == 'development'

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.app_env.lower() == 'production'

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


# Global settings instance
settings = Settings()


# Helper function for getting settings (useful for dependency injection)
def get_settings() -> Settings:
    """Get application settings instance"""
    return settings
