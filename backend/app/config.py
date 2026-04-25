from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./changelog.db"
    github_client_id: str = ""
    github_client_secret: str = ""
    jwt_secret: str = "dev-secret-change-in-production"
    frontend_url: str = "http://localhost:5173"
    base_url: str = "http://localhost:8000"

    # Stripe — fill in after creating your Stripe account
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""  # the $19/month price ID from Stripe

    model_config = {"env_file": ".env"}


settings = Settings()
