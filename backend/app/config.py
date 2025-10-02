import os
from pydantic_settings import BaseSettings
from pydantic import Field
from langchain_google_genai import ChatGoogleGenerativeAI
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()  # manually load .env
# print("google_api_key:", os.getenv("google_api_key"))
# print("tavily_api_key:", os.getenv("tavily_api_key"))

class Settings(BaseSettings):
    google_api_key: str = Field(os.getenv("google_api_key"), description="Google Gemini API key")
    tavily_api_key: str = Field(os.getenv("tavily_api_key"), description="Tavily API key")
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    cors_origins: str = Field(default="http://localhost:3000")
    gemini_model: str = Field(default="gemini-2.0-flash-exp")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=100, le=8192)
    max_file_size: int = Field(default=10 * 1024 * 1024)

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self):
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
print(settings.google_api_key)  # Debugging line to check if the key is loaded correctly

@lru_cache()
def load_google_llm():
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=settings.temperature,
        max_output_tokens=settings.max_tokens,
        convert_system_message_to_human=True
    )


@lru_cache()
def load_google_vision_llm():
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.5,
        max_output_tokens=settings.max_tokens,
        convert_system_message_to_human=True
    )

# # import os
# # from pathlib import Path
# # from dotenv import load_dotenv
# # load_dotenv()
# # from pydantic_settings import BaseSettings

# # Locate and normalize .env
# env_path = Path(__file__).parent.parent / ".env"
# # try:
# if env_path.exists():
#     with open(env_path, "r", encoding="utf-8") as f:
#         content = f.read().replace("\r\n", "\n").strip()
#     with open(env_path, "w", encoding="utf-8") as f:
#         f.write(content)

#     load_dotenv(dotenv_path=env_path)
# else:
#     raise FileNotFoundError(f".env file not found at {env_path}")
# # except FileNotFoundError:
# #     print("✅ google_api_key loaded:", settings.google_api_key)
# #     print("✅ tavily_api_key loaded:", settings.tavily_api_key)
# # Settings class
# class Settings(BaseSettings):
#     google_api_key: str = google_ap
#     tavily_api_key: str = tavily_api_key
#     HOST: str = "0.0.0.0"
#     PORT: int = 8000
#     CORS_ORIGINS: str = "http://localhost:3000,http://
#     GEMINI_MODEL: str = "gemini-2.0-flash-exp"
#     TEMPERATURE: float = 0.7
#     MAX_TOKENS: int = 2048

#     class Config:
#         env_file = env_path
#         case_sensitive = True

# # Initialize settings
# settings = Settings()

# print("✅ google_api_key loaded:", settings.google_api_key)
# print("✅ tavily_api_key loaded:", settings.tavily_api_key)
