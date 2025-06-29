import json
import os
from generator import generate_audio


def main(limit: int | None = None):
    # Read words.json
    words_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "src", "assets", "words.json"
    )
    with open(words_path, "r", encoding="utf-8") as f:
        words_data = json.load(f)

    # Create output directories
    base_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "src", "assets", "audio"
    )
    words_dir = os.path.join(base_path, "words")
    examples_dir = os.path.join(base_path, "examples")

    os.makedirs(words_dir, exist_ok=True)
    os.makedirs(examples_dir, exist_ok=True)

    processed_count = 0
    # Process each word
    for key, word in words_data.items():
        if limit and processed_count >= limit:
            break
        korean = word.get("korean", "")
        korean_example = word.get("korean_example_sentence", "")

        if korean:
            word_output = os.path.join(words_dir, korean)
            print(f"Generating audio for word: {korean}")
            generate_audio(korean, word_output)

        if korean_example:
            example_output = os.path.join(examples_dir, korean)
            print(f"Generating audio for example: {korean_example}")
            generate_audio(korean_example, example_output)

        processed_count += 1


if __name__ == "__main__":
    main(2)
