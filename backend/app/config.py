from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./changelog.db"
    github_client_id: str = ""
    github_client_secret: str = ""
    anthropic_api_key: str = ""
    jwt_secret: str = "dev-secret-change-in-production"
    frontend_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env"}


settings = Settings()
