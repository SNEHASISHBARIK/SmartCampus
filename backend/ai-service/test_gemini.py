import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

if not api_key or api_key == "YOUR_GEMINI_API_KEY":
    raise RuntimeError("Add your real Gemini API key to .env")

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model=model,
    contents="Reply with exactly: Gemini connection successful"
)

print(response.text.strip())
