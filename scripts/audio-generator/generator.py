import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()


def generate_audio(text: str, output_file_name: str):
    elevenlabs = ElevenLabs(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
    )
    audio = elevenlabs.text_to_speech.convert(
        text=text,
        voice_id="xi3rF0t7dg7uN2M0WUhr",  # Yuna
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    with open(f"{output_file_name}.mp3", "wb") as f:
        for chunk in audio:
            f.write(chunk)
