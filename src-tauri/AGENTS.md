# Tauri Backend

This document provides guidelines specific to the Tauri backend (Rust) in the Kotonoha project.

## Tech stack

- Desktop framework: Tauri (Rust backend). Rust implements LLM calls, Stronghold-based secret storage, audio processing, and other system integrations.

## Key Tauri commands

- LLM: `analyze_sentence_with_llm(api_key: String, learning_language: String, explanation_language: String, context: String, target_sentence: String) -> Result<SentenceMiningResult, String>`
- Stronghold: `get_stronghold_password() -> Result<String, String>`
- Audio commands: `open_audio(path: String)`, `analyze_audio(path: String, max_peaks: usize) -> AudioInfo`, `play_audio()`, `pause_audio()`, `resume_audio()`, `stop_audio()`, `seek_audio(position_ms: u32)`, `copy_audio_file(src_path: String, dest_path: String)`
  - `analyze_audio` returns an `AudioInfo` struct with `duration` (ms) and `peaks: Vec<f32>`.
- Download command: `download_file_with_progress(url: String, file_path: String, download_id: String) -> Result<(), String>`
  - The caller provides a `download_id` (string) to correlate progress events and cancellation. Progress is emitted via the `download_progress` event.
- Cancel download command: `cancel_download(download_id: String) -> Result<(), String>`
- TTS command: `start_tts(transcript: String, config_path: String, speaker_id: u32) -> Result<{ audio_path: String, script_path: String }, String>`
  - Runs TTS using the given transcript and config. Returns both the temporary OGG `audio_path` and an SSWT `script_path`. Progress is reported via the `tts-progress` event.
  - Cancel TTS: `cancel_tts() -> Result<(), String>`
    - Cancels an in-progress TTS operation.
- YouTube subtitle: `fetch_youtube_subtitle(video_id: String, language: String, track_kind: String) -> Result<Vec<AtomicDialogue>, String>`
  - Fetches transcript segments from YouTube; returns a list of `AtomicDialogue` records with `start_time_ms`, optional `end_time_ms`, and `original_text`.
- Language Detection command: `detect_language_from_text(text: String) -> Option<String>`
- Utility: `read_text_file(path: String) -> Result<String, String>`

## Security notes

- API keys are persisted via Tauri Stronghold plugin. Agents should never print or hard-code secrets. Stronghold uses a salt generated on first run and stored under app local data.

## Logging

- In Rust code, use: `use log::{info, warn, error};`.

## Related documents

- [Project root AGENTS.md](../AGENTS.md) - Overall project guidelines
- [Frontend AGENTS.md](../src/AGENTS.md)
- [E2E Tests AGENTS.md](../e2e-tests/AGENTS.md)
