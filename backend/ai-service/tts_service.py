import base64
import os
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="SmartCampus Gemini TTS")

# Allow requests from frontend (localhost:5173) and any local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_TTS_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "YOUR_GEMINI_API_KEY":
    raise RuntimeError("GEMINI_TTS_API_KEY is missing from the environment.")

client = None
try:
    # Set a strict 4-second timeout with 1 attempt so it never hangs or blocks the student
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            timeout=4000,
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )
except Exception as e:
    print(f"[Gemini TTS] Warning initializing client: {e}")

# In-memory cache to make repeated questions or greetings instant (0ms delay)
AUDIO_CACHE = {}


class SpeechRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {
        "status": "Gemini TTS service is running",
        "gemini_configured": client is not None,
        "cached_items": len(AUDIO_CACHE),
    }


@app.post("/tts")
def generate_speech(request: SpeechRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=400, detail="Speech text cannot be empty."
        )

    if len(text) > 4000:
        raise HTTPException(
            status_code=400, detail="Text is too long for this endpoint."
        )

    # 1. Fast path: In-memory cache
    if text in AUDIO_CACHE:
        print(f"[Gemini TTS] Cache hit (0.00s): {text[:50]}...")
        return Response(
            content=AUDIO_CACHE[text],
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini AI client is not configured.",
        )

    start_time = time.perf_counter()
    audio_bytes = None

    # Single targeted call with gemini-2.0-flash audio output
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Read aloud this interview question clearly with natural pacing:\n\n{text}",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Kore"
                        )
                    )
                ),
            ),
        )
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    audio_bytes = base64.b64decode(inline.data)
                    break
    except Exception as exc:
        elapsed = time.perf_counter() - start_time
        print(f"[Gemini TTS] Audio generation error after {elapsed:.2f}s: {exc}")

    if audio_bytes:
        AUDIO_CACHE[text] = audio_bytes
        elapsed = time.perf_counter() - start_time
        print(f"[Gemini TTS] Generated {len(audio_bytes)} bytes in {elapsed:.2f}s")
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    raise HTTPException(
        status_code=502,
        detail="Speech generation unavailable.",
    )
