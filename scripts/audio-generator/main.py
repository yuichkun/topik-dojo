import json
import os
import time
from datetime import datetime
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

    # Statistics tracking
    total_words = len(words_data)
    processed_count = 0
    skipped_words = 0
    skipped_examples = 0
    generated_words = 0
    generated_examples = 0
    start_time = time.time()

    print(f"=== Audio Generation Script Started ===")
    print(f"Total words to process: {total_words}")
    print(f"Output directory: {base_path}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 40)

    # Process each word
    for key, word in words_data.items():
        if limit and processed_count >= limit:
            print(f"\nReached limit of {limit} words. Stopping.")
            break

        korean = word.get("korean", "")
        korean_example = word.get("korean_example_sentence", "")

        # Progress logging every 5 words
        if processed_count > 0 and processed_count % 5 == 0:
            elapsed = time.time() - start_time
            avg_time = elapsed / processed_count
            remaining = (total_words - processed_count) * avg_time
            print(
                f"\n--- Progress: {processed_count}/{total_words} ({processed_count/total_words*100:.1f}%) ---"
            )
            print(
                f"Elapsed: {elapsed/60:.1f} min, Estimated remaining: {remaining/60:.1f} min"
            )
            print(f"Generated: {generated_words} words, {generated_examples} examples")
            print(f"Skipped: {skipped_words} words, {skipped_examples} examples")

        # Generate word audio
        if korean:
            word_output_path = os.path.join(words_dir, f"{korean}.mp3")
            if os.path.exists(word_output_path):
                skipped_words += 1
            else:
                print(
                    f"[{processed_count + 1}/{total_words}] Generating word audio: {korean}"
                )
                try:
                    generate_audio(korean, os.path.join(words_dir, korean))
                    generated_words += 1
                except Exception as e:
                    print(f"  ERROR generating word audio: {e}")

        # Generate example audio
        if korean_example and korean:  # Need korean for filename
            example_output_path = os.path.join(examples_dir, f"{korean}.mp3")
            if os.path.exists(example_output_path):
                skipped_examples += 1
            else:
                print(
                    f"[{processed_count + 1}/{total_words}] Generating example audio: {korean_example[:50]}..."
                )
                try:
                    generate_audio(korean_example, os.path.join(examples_dir, korean))
                    generated_examples += 1
                except Exception as e:
                    print(f"  ERROR generating example audio: {e}")

        processed_count += 1

    # Final statistics
    elapsed_total = time.time() - start_time
    print("\n" + "=" * 40)
    print(f"=== Audio Generation Complete ===")
    print(f"Total processed: {processed_count}/{total_words}")
    print(f"Generated: {generated_words} words, {generated_examples} examples")
    print(f"Skipped (existing): {skipped_words} words, {skipped_examples} examples")
    print(f"Total time: {elapsed_total/60:.1f} minutes")
    print(f"Average time per word: {elapsed_total/processed_count:.2f} seconds")
    print("\nTo generate audio mappings, run: python generate_mappings.py")


if __name__ == "__main__":
    import sys

    # Check if limit is provided as command line argument
    limit = None
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
            print(f"Running with limit: {limit} words\n")
        except ValueError:
            print(f"Invalid limit argument: {sys.argv[1]}, running without limit\n")

    main(limit)
