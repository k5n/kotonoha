# Kotonoha

## Overview

Kotonoha is a desktop application that helps language learners transform audio/video and transcript content into context-rich study materials using AI-powered "sentence mining". Users import pairs of audio/video files and corresponding transcripts. The app highlights sentences in their original context, lets learners mark sentences or expressions to analyze, and uses an LLM to extract key vocabulary, idioms, and explanatory notes which are saved as study cards (Anki-friendly CSV export supported).

## Technical summary

- Tech stack & architecture
  - Frontend: Svelte 5 + SvelteKit (TypeScript). Use Svelte Runes (`$state`, `$effect`, etc.) and SvelteKit `load` conventions.
  - Desktop framework: Tauri (Rust backend). Rust implements LLM calls, Stronghold-based secret storage, audio processing, and other system integrations.
  - DB: SQLite (accessed via Tauri SQL plugin). App uses file-based DBs: `dev.db` for development and `app.db` for release.
- Layered architecture
  - Structure: Four-layer architecture with specific flow: Presentation → Application → Infrastructure. Domain layer (entities/services) is shared across all layers.
  - Layer responsibilities:
    - **Presentation** (routes, components): Routes are page-level components that compose UI parts and delegate business logic to usecases. Components are individual UI parts without business logic. Routes invoke usecases; components may access stores directly to avoid prop drilling.
    - **Application** (usecases, stores): Usecases orchestrate workflows by calling domain services and infrastructure repositories. Stores manage cross-component UI state only (no business logic, no usecase invocation). Usecases may access stores directly to avoid prop drilling, but not vice versa.
    - **Domain** (entities, services): Entities are pure data types (no logic). Services are pure functions depending only on entities. Only usecases invoke services.
    - **Infrastructure** (repositories): Handles external system communication: Tauri commands, DB operations, file system access, HTTP requests, etc. Repositories consolidate external system communication.
  - Dependency flow: While labeled as four layers, the actual processing hierarchy is three-tier (Presentation → Application → Infrastructure). All layers depend on Domain entities; only usecases depend on Domain services. No dependency inversion is used - repositories are called directly by usecases (not Clean Architecture style).
  - Rationale: Keeps UI separate from business rules and infrastructure, makes domain logic testable, and allows backend evolution independent of frontend UI.
- Key Tauri commands
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

## Agent workflow notes

- When creating a fresh Git worktree environment as an AI Agent, run `npm ci` instead of `npm install` so that `package-lock.json` remains unchanged.
- Database overview
  - Tables:
    - `episode_groups`: hierarchical groups (self-referential `parent_group_id` nullable). Key fields: `id` (PK), `name`, `display_order`, `parent_group_id`, `group_type` (`album`|`folder`). Root default group: name="Default", `group_type`=`album`.
    - `episodes`: one row per episode (audio + transcript). Key fields: `id`, `episode_group_id` (FK), `display_order`, `title`, `media_path` (relative path under app data), `learning_language`, `explanation_language`, `created_at`, `updated_at`.
    - `dialogues`: transcript lines. Key fields: `id`, `episode_id` (FK), `start_time_ms`, `end_time_ms` (nullable), `original_text`, `corrected_text` (nullable), `translation` (nullable), `explanation` (nullable), `sentence` (nullable), `deleted_at` (nullable).
    - `sentence_cards`: results of sentence-mining. Key fields: `id`, `dialogue_id` (FK), `part_of_speech`, `expression`, `sentence`, `contextual_definition`, `core_meaning`, `status` (`active`|`suspended`|`cache`), `created_at`.
  - Note: types above are compact hints; timestamps use ISO 8601 strings. Use DB as single source of truth; front-end stores should be transient UI state only.
- File & media storage policy
  - Store episode media under Tauri `BaseDirectory.AppLocalData` in `media/{UUID}/`.
  - Fixed filename convention: audio stored at `media/{UUID}/full.mp3` (or other audio extension). `episodes.media_path` stores the relative path from AppLocalData.
  - UUID uniqueness: generate and check `media/{UUID}` existence; regenerate on collision.
  - Deletion: `deleteEpisode` must remove the DB record first, then recursively delete `media/{UUID}` directory on success.
- Data & state strategy for agents
  - Front-end principle: avoid long-lived client-side caches. Components and stores should fetch authoritative data from the DB (via infrastructure repositories / Tauri commands) when needed. Stores manage ephemeral UI state only.
- Security notes
  - API keys are persisted via Tauri Stronghold plugin. Agents should never print or hard-code secrets. Stronghold uses a salt generated on first run and stored under app local data.
- Where to find full details
  - Use `doc/technical_specifications.md` for exhaustive DB schemas, mermaid diagrams, and full command descriptions. This summary is meant to be a compact reference for AI agents.

## Browser-mode (Vite aliases and Tauri mocks)

For fast frontend iteration and browser-based testing, this repository supports a "browser-mode" which replaces Tauri and plugin imports with local mock modules via Vite aliasing.

- How to enable:
  - Run the browser dev script:
    ```bash
    npm run dev:browser
    ```
  - This sets `VITE_RUN_MODE=browser` which activates alias mappings in `vite.config.js`.
- What is mocked:
  - The Vite config maps many Tauri imports to `src/mocks/*`. Examples include:
    - `@tauri-apps/plugin-store`
    - `@tauri-apps/api/app`
    - `@tauri-apps/plugin-stronghold`
    - `@tauri-apps/api/core`
    - `@tauri-apps/api/event`
    - `@tauri-apps/api/path`
    - `@tauri-apps/plugin-log`
    - `@tauri-apps/plugin-sql`
    - `@tauri-apps/plugin-fs`
    - `@tauri-apps/plugin-http`
    - `@tauri-apps/plugin-dialog`
  - See `vite.config.js` for the exact mapping.
- Where to look / extend:
  - Mock implementations live under `src/mocks/`. They provide minimal, frontend-friendly APIs used by the app. If a UI needs extra behavior, extend the mock file accordingly.
- Agent guidance and limitations:
  - Do not assume native Tauri behavior (secure Stronghold storage, native file system access, audio device control, OS-level dialogs) in browser-mode. These are stubbed or emulated.
  - Use browser-mode for UI development, layout, and component tests. For features that require Rust/Tauri integration (LLM proxying, real DB access, secure key storage, native audio), run the full Tauri environment (`npm run dev`) or use integration tests that exercise the Rust side.

## Frontend dependency list

<!-- DEP_GRAPH_START -->

- src/lib/application/stores/audioInfoCacheStore.svelte.ts -> src/lib/domain/entities/audioInfo.ts
- src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts
- src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/ttsDownloadStore.svelte.ts
- src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/ttsExecutionStore.svelte.ts
- src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts -> src/lib/application/stores/i18n.svelte.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts -> src/lib/utils/language.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts -> src/lib/domain/entities/scriptPreview.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts -> src/lib/application/stores/i18n.svelte.ts
- src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts -> src/lib/domain/entities/voice.ts
- src/lib/application/stores/episodeAddStore/ttsDownloadStore.svelte.ts -> src/lib/domain/entities/ttsEvent.ts
- src/lib/application/stores/episodeAddStore/ttsExecutionStore.svelte.ts -> src/lib/domain/entities/ttsEvent.ts
- src/lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte.ts -> src/lib/domain/entities/youtubeMetadata.ts
- src/lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte.ts -> src/lib/utils/language.ts
- src/lib/application/stores/groupPathStore.svelte.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/stores/i18n.svelte.ts -> src/lib/application/locales/en.ts
- src/lib/application/stores/i18n.svelte.ts -> src/lib/application/locales/ja.ts
- src/lib/application/usecases/addEpisodeGroup.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/addEpisodeGroup.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/entities/episode.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/entities/youtubeMetadata.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/services/generateEpisodeFilenames.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/services/parseScriptToDialogues.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/domain/services/youtubeUrlValidator.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/infrastructure/repositories/fileRepository.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/infrastructure/repositories/youtubeRepository.ts
- src/lib/application/usecases/addNewEpisode.ts -> src/lib/utils/language.ts
- src/lib/application/usecases/addSentenceCards.ts -> src/lib/infrastructure/repositories/sentenceCardRepository.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/application/stores/apiKeyStore.svelte.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/domain/entities/sentenceAnalysisResult.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/infrastructure/repositories/apiKeyRepository.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/infrastructure/repositories/llmRepository.ts
- src/lib/application/usecases/analyzeDialogueForMining.ts -> src/lib/infrastructure/repositories/sentenceCardRepository.ts
- src/lib/application/usecases/deleteEpisode.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/deleteEpisode.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/deleteEpisode.ts -> src/lib/infrastructure/repositories/fileRepository.ts
- src/lib/application/usecases/deleteEpisode.ts -> src/lib/infrastructure/repositories/sentenceCardRepository.ts
- src/lib/application/usecases/deleteGroupRecursive.ts -> src/lib/application/usecases/deleteEpisode.ts
- src/lib/application/usecases/deleteGroupRecursive.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/deleteGroupRecursive.ts -> src/lib/domain/services/groupTreeHelper.ts
- src/lib/application/usecases/deleteGroupRecursive.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/deleteGroupRecursive.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/domain/services/extractScriptText.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/infrastructure/repositories/fileRepository.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/infrastructure/repositories/languageDetectionRepository.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/infrastructure/repositories/settingsRepository.ts
- src/lib/application/usecases/detectScriptLanguage.ts -> src/lib/utils/language.ts
- src/lib/application/usecases/downloadTtsModel.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts
- src/lib/application/usecases/downloadTtsModel.ts -> src/lib/application/stores/episodeAddStore/ttsDownloadStore.svelte.ts
- src/lib/application/usecases/downloadTtsModel.ts -> src/lib/domain/entities/voice.ts
- src/lib/application/usecases/downloadTtsModel.ts -> src/lib/infrastructure/repositories/ttsRepository.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/application/stores/episodeAddStore/ttsExecutionStore.svelte.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/domain/services/extractScriptText.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/infrastructure/repositories/fileRepository.ts
- src/lib/application/usecases/executeTts.ts -> src/lib/infrastructure/repositories/ttsRepository.ts
- src/lib/application/usecases/fetchAppInfo.ts -> src/lib/domain/entities/appInfo.ts
- src/lib/application/usecases/fetchAppInfo.ts -> src/lib/infrastructure/repositories/appInfoRepository.ts
- src/lib/application/usecases/fetchAvailableParentGroups.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/fetchAvailableParentGroups.ts -> src/lib/domain/services/buildEpisodeGroupTree.ts
- src/lib/application/usecases/fetchAvailableParentGroups.ts -> src/lib/domain/services/groupTreeHelper.ts
- src/lib/application/usecases/fetchAvailableParentGroups.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/fetchAvailableTargetGroupsForEpisodeMove.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/fetchAvailableTargetGroupsForEpisodeMove.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/domain/entities/episode.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/domain/entities/sentenceCard.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/fetchEpisodeDetail.ts -> src/lib/infrastructure/repositories/sentenceCardRepository.ts
- src/lib/application/usecases/fetchEpisodeGroups.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/fetchEpisodeGroups.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/fetchEpisodes.ts -> src/lib/domain/entities/episode.ts
- src/lib/application/usecases/fetchEpisodes.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/fetchEpisodes.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/fetchEpisodes.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/fetchSettings.ts -> src/lib/application/stores/apiKeyStore.svelte.ts
- src/lib/application/usecases/fetchSettings.ts -> src/lib/domain/entities/settings.ts
- src/lib/application/usecases/fetchSettings.ts -> src/lib/infrastructure/repositories/apiKeyRepository.ts
- src/lib/application/usecases/fetchSettings.ts -> src/lib/infrastructure/repositories/settingsRepository.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/application/usecases/detectScriptLanguage.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/domain/entities/voice.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/infrastructure/repositories/settingsRepository.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/infrastructure/repositories/ttsRepository.ts
- src/lib/application/usecases/fetchTtsVoices.ts -> src/lib/utils/language.ts
- src/lib/application/usecases/fetchYoutubeMetadata.ts -> src/lib/application/stores/apiKeyStore.svelte.ts
- src/lib/application/usecases/fetchYoutubeMetadata.ts -> src/lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte.ts
- src/lib/application/usecases/fetchYoutubeMetadata.ts -> src/lib/domain/services/youtubeUrlValidator.ts
- src/lib/application/usecases/fetchYoutubeMetadata.ts -> src/lib/infrastructure/repositories/apiKeyRepository.ts
- src/lib/application/usecases/fetchYoutubeMetadata.ts -> src/lib/infrastructure/repositories/youtubeRepository.ts
- src/lib/application/usecases/initializeApplication.ts -> src/lib/application/stores/i18n.svelte.ts
- src/lib/application/usecases/initializeApplication.ts -> src/lib/infrastructure/repositories/settingsRepository.ts
- src/lib/application/usecases/mediaPlayer/audioPlayer.ts -> src/lib/application/stores/audioInfoCacheStore.svelte.ts
- src/lib/application/usecases/mediaPlayer/audioPlayer.ts -> src/lib/application/stores/mediaPlayerStore.svelte.ts
- src/lib/application/usecases/mediaPlayer/audioPlayer.ts -> src/lib/application/usecases/mediaPlayer/mediaPlayer.ts
- src/lib/application/usecases/mediaPlayer/audioPlayer.ts -> src/lib/domain/entities/audioInfo.ts
- src/lib/application/usecases/mediaPlayer/audioPlayer.ts -> src/lib/infrastructure/repositories/audioRepository.ts
- src/lib/application/usecases/mediaPlayer/youtubePlayer.ts -> src/lib/application/stores/mediaPlayerStore.svelte.ts
- src/lib/application/usecases/mediaPlayer/youtubePlayer.ts -> src/lib/application/usecases/mediaPlayer/mediaPlayer.ts
- src/lib/application/usecases/mediaPlayer/youtubePlayer.ts -> src/lib/domain/services/youtubeUrlValidator.ts
- src/lib/application/usecases/moveEpisode.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/moveEpisodeGroup.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/moveEpisodeGroup.ts -> src/lib/domain/services/groupTreeHelper.ts
- src/lib/application/usecases/moveEpisodeGroup.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/previewScriptFile.ts -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/lib/application/usecases/previewScriptFile.ts -> src/lib/domain/services/parseScriptPreview.ts
- src/lib/application/usecases/previewScriptFile.ts -> src/lib/infrastructure/repositories/fileRepository.ts
- src/lib/application/usecases/saveSettings.ts -> src/lib/application/stores/i18n.svelte.ts
- src/lib/application/usecases/saveSettings.ts -> src/lib/domain/entities/settings.ts
- src/lib/application/usecases/saveSettings.ts -> src/lib/infrastructure/repositories/apiKeyRepository.ts
- src/lib/application/usecases/saveSettings.ts -> src/lib/infrastructure/repositories/settingsRepository.ts
- src/lib/application/usecases/softDeleteDialogue.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/undoSoftDeleteDialogue.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/updateDialogue.ts -> src/lib/infrastructure/repositories/dialogueRepository.ts
- src/lib/application/usecases/updateEpisodeGroupName.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/updateEpisodeGroupName.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/updateEpisodeGroupsOrder.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/application/usecases/updateEpisodeGroupsOrder.ts -> src/lib/infrastructure/repositories/episodeGroupRepository.ts
- src/lib/application/usecases/updateEpisodeName.ts -> src/lib/domain/entities/episode.ts
- src/lib/application/usecases/updateEpisodeName.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/application/usecases/updateEpisodesOrder.ts -> src/lib/domain/entities/episode.ts
- src/lib/application/usecases/updateEpisodesOrder.ts -> src/lib/infrastructure/repositories/episodeRepository.ts
- src/lib/domain/entities/sentenceAnalysisResult.ts -> src/lib/domain/entities/sentenceCard.ts
- src/lib/domain/services/buildEpisodeGroupTree.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/domain/services/extractScriptText.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/domain/services/extractScriptText.ts -> src/lib/domain/services/parseScriptToDialogues.ts
- src/lib/domain/services/extractScriptText.ts -> src/lib/domain/services/parseTsvToText.ts
- src/lib/domain/services/groupTreeHelper.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/domain/services/parseScriptPreview.ts -> src/lib/domain/entities/scriptPreview.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/services/parseSrtToDialogues.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/services/parseSswtToDialogues.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/services/parseTsvToDialogues.ts
- src/lib/domain/services/parseScriptToDialogues.ts -> src/lib/domain/services/parseVttToDialogues.ts
- src/lib/domain/services/parseSrtToDialogues.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/domain/services/parseSswtToDialogues.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/domain/services/parseTsvToDialogues.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/domain/services/parseTsvToDialogues.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/domain/services/parseTsvToText.ts -> src/lib/domain/entities/tsvConfig.ts
- src/lib/domain/services/parseVttToDialogues.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/infrastructure/config.ts -> src/lib/infrastructure/repositories/environmentRepository.ts
- src/lib/infrastructure/repositories/appInfoRepository.ts -> src/lib/domain/entities/appInfo.ts
- src/lib/infrastructure/repositories/audioRepository.ts -> src/lib/domain/entities/audioInfo.ts
- src/lib/infrastructure/repositories/dialogueRepository.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/infrastructure/repositories/dialogueRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/episodeGroupRepository.ts -> src/lib/domain/entities/episodeGroup.ts
- src/lib/infrastructure/repositories/episodeGroupRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/episodeRepository.ts -> src/lib/domain/entities/episode.ts
- src/lib/infrastructure/repositories/episodeRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/fileRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/llmRepository.ts -> src/lib/domain/entities/sentenceAnalysisResult.ts
- src/lib/infrastructure/repositories/sentenceCardRepository.ts -> src/lib/domain/entities/sentenceAnalysisResult.ts
- src/lib/infrastructure/repositories/sentenceCardRepository.ts -> src/lib/domain/entities/sentenceCard.ts
- src/lib/infrastructure/repositories/sentenceCardRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/settingsRepository.ts -> src/lib/domain/entities/settings.ts
- src/lib/infrastructure/repositories/settingsRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/ttsRepository.ts -> src/lib/domain/entities/ttsEvent.ts
- src/lib/infrastructure/repositories/ttsRepository.ts -> src/lib/domain/entities/voice.ts
- src/lib/infrastructure/repositories/ttsRepository.ts -> src/lib/infrastructure/config.ts
- src/lib/infrastructure/repositories/ttsRepository.ts -> src/lib/utils/language.ts
- src/lib/infrastructure/repositories/youtubeRepository.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/infrastructure/repositories/youtubeRepository.ts -> src/lib/domain/entities/youtubeMetadata.ts
- src/lib/presentation/actions/keyboardShortcuts.ts -> src/lib/application/usecases/mediaPlayer/mediaPlayer.ts
- src/lib/presentation/actions/keyboardShortcuts.ts -> src/lib/domain/entities/dialogue.ts
- src/lib/presentation/components/Breadcrumbs.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/Breadcrumbs.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/lib/presentation/components/ConfirmModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/EpisodeAddModal.svelte -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/lib/presentation/components/EpisodeAddModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/EpisodeAddModal.svelte -> src/lib/presentation/components/FileEpisodeForm.svelte
- src/lib/presentation/components/EpisodeAddModal.svelte -> src/lib/presentation/components/YoutubeEpisodeForm.svelte
- src/lib/presentation/components/EpisodeListTable.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/EpisodeListTable.svelte -> src/lib/domain/entities/episode.ts
- src/lib/presentation/components/EpisodeListTable.svelte -> src/lib/presentation/utils/dateFormatter.ts
- src/lib/presentation/components/EpisodeMoveModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/EpisodeMoveModal.svelte -> src/lib/domain/entities/episode.ts
- src/lib/presentation/components/EpisodeMoveModal.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/lib/presentation/components/EpisodeNameEditModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/presentation/components/FileSelect.svelte
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/presentation/components/TsvConfigSection.svelte
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/presentation/components/TtsConfigSection.svelte
- src/lib/presentation/components/FileEpisodeForm.svelte -> src/lib/utils/language.ts
- src/lib/presentation/components/FileSelect.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/GroupAddModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/GroupAddModal.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/lib/presentation/components/GroupGrid.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/GroupGrid.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/lib/presentation/components/GroupMoveModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/GroupMoveModal.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/lib/presentation/components/GroupNameEditModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/LanguageSelectionModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/LanguageSelectionModal.svelte -> src/lib/utils/language.ts
- src/lib/presentation/components/SentenceCardList.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/SentenceCardList.svelte -> src/lib/domain/entities/sentenceCard.ts
- src/lib/presentation/components/SentenceCardList.svelte -> src/lib/presentation/utils/dateFormatter.ts
- src/lib/presentation/components/SentenceMiningModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/SentenceMiningModal.svelte -> src/lib/domain/entities/dialogue.ts
- src/lib/presentation/components/SentenceMiningModal.svelte -> src/lib/domain/entities/sentenceAnalysisResult.ts
- src/lib/presentation/components/TranscriptViewer.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/TranscriptViewer.svelte -> src/lib/domain/entities/dialogue.ts
- src/lib/presentation/components/TsvConfigSection.svelte -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/tsvConfigStore.svelte.ts
- src/lib/presentation/components/TsvConfigSection.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/TtsConfigSection.svelte -> src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/ttsConfigStore.svelte.ts
- src/lib/presentation/components/TtsConfigSection.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/TtsExecutionModal.svelte -> src/lib/application/stores/episodeAddStore/ttsExecutionStore.svelte.ts
- src/lib/presentation/components/TtsExecutionModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/TtsModelDownloadModal.svelte -> src/lib/application/stores/episodeAddStore/ttsDownloadStore.svelte.ts
- src/lib/presentation/components/TtsModelDownloadModal.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/YoutubeEpisodeForm.svelte -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/lib/presentation/components/YoutubeEpisodeForm.svelte -> src/lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte.ts
- src/lib/presentation/components/YoutubeEpisodeForm.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/lib/presentation/components/YoutubeEpisodeForm.svelte -> src/lib/utils/language.ts
- src/routes/+layout.ts -> src/lib/application/usecases/initializeApplication.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/stores/groupPathStore.svelte.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/addEpisodeGroup.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/deleteGroupRecursive.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/fetchAvailableParentGroups.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/moveEpisodeGroup.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/updateEpisodeGroupName.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/application/usecases/updateEpisodeGroupsOrder.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/Breadcrumbs.svelte
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/ConfirmModal.svelte
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/GroupAddModal.svelte
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/GroupGrid.svelte
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/GroupMoveModal.svelte
- src/routes/[...groupId]/+page.svelte -> src/lib/presentation/components/GroupNameEditModal.svelte
- src/routes/[...groupId]/+page.ts -> src/lib/application/usecases/fetchEpisodeGroups.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/stores/episodeAddStore/episodeAddStore.svelte.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/stores/groupPathStore.svelte.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/addNewEpisode.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/deleteEpisode.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/detectScriptLanguage.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/downloadTtsModel.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/executeTts.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/fetchAvailableTargetGroupsForEpisodeMove.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/fetchTtsVoices.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/fetchYoutubeMetadata.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/moveEpisode.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/previewScriptFile.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/updateEpisodeName.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/application/usecases/updateEpisodesOrder.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/domain/entities/episode.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/domain/entities/episodeGroup.ts
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/Breadcrumbs.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/ConfirmModal.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/EpisodeAddModal.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/EpisodeListTable.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/EpisodeMoveModal.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/EpisodeNameEditModal.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/TtsExecutionModal.svelte
- src/routes/episode-list/[groupId]/+page.svelte -> src/lib/presentation/components/TtsModelDownloadModal.svelte
- src/routes/episode-list/[groupId]/+page.ts -> src/lib/application/usecases/fetchEpisodes.ts
- src/routes/episode-list/[groupId]/+page.ts -> src/lib/domain/entities/episode.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/stores/mediaPlayerStore.svelte.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/addSentenceCards.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/analyzeDialogueForMining.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/mediaPlayer/youtubePlayer.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/softDeleteDialogue.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/undoSoftDeleteDialogue.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/application/usecases/updateDialogue.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/domain/entities/dialogue.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/domain/entities/sentenceAnalysisResult.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/domain/entities/sentenceCard.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/actions/keyboardShortcuts.ts
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/components/AudioPlayer.svelte
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/components/ConfirmModal.svelte
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/components/SentenceCardList.svelte
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/components/SentenceMiningModal.svelte
- src/routes/episode/[id]/+page.svelte -> src/lib/presentation/components/TranscriptViewer.svelte
- src/routes/episode/[id]/+page.ts -> src/lib/application/usecases/fetchEpisodeDetail.ts
- src/routes/episode/[id]/+page.ts -> src/lib/application/usecases/fetchSettings.ts
- src/routes/episode/[id]/+page.ts -> src/lib/application/usecases/mediaPlayer/audioPlayer.ts
- src/routes/episode/[id]/+page.ts -> src/lib/application/usecases/mediaPlayer/mediaPlayer.ts
- src/routes/episode/[id]/+page.ts -> src/lib/application/usecases/mediaPlayer/youtubePlayer.ts
- src/routes/episode/[id]/+page.ts -> src/lib/domain/entities/audioInfo.ts
- src/routes/settings/+page.svelte -> src/lib/application/stores/i18n.svelte.ts
- src/routes/settings/+page.svelte -> src/lib/application/usecases/saveSettings.ts
- src/routes/settings/+page.svelte -> src/lib/presentation/components/LanguageSelectionModal.svelte
- src/routes/settings/+page.svelte -> src/lib/utils/language.ts
- src/routes/settings/+page.ts -> src/lib/application/usecases/fetchAppInfo.ts
- src/routes/settings/+page.ts -> src/lib/application/usecases/fetchSettings.ts

<!-- DEP_GRAPH_END -->

## Svelte / SvelteKit coding rules

The following is a compact, machine-friendly summary of the project's Svelte and SvelteKit conventions. Agents should follow these when reading or producing frontend code in this repository.

- Use Svelte 5 runes for reactivity: prefer `$state`, `$derived`, `$effect` instead of `$:` labels or ad-hoc `let` reactivity.
- Event handlers: use native DOM attributes like `onclick` / `onchange` (not `on:click`). Name component callback props in camelCase with an `on` prefix (e.g., `onGroupClick`).
- Two-way binding: declare objects with `$state` and bind properties directly (`bind:value={form.name}`).
- Bindable props: expose parent-bindable props by using `$props()` with `$bindable()` as the default (child example: `let { open = $bindable() } = $props();`).
- Side effects and lifecycle: use `$effect` only for DOM or external side-effects; return cleanup functions when needed. Prefer declarative approaches where possible.
- Reusable render fragments: prefer `{#snippet}` / `@render` patterns over legacy `slot` usage for passing renderable fragments.
- DOM refs: create a `$state(null)` variable and use `bind:this={el}` to capture element references.
- Pages/load: use a `+page.ts` `load` function to fetch data and receive it in `+page.svelte` via `$props()`; use generated `./$types` types (e.g., `PageLoad`, `PageProps`).
- Stores: implement stores with Svelte runes; export an object with getters and operation methods (e.g., `counterStore.value`, `counterStore.increment()`). Use filename extension `*.svelte.ts` for stores.
- File placement: follow the layered architecture: `presentation` (components/actions), `application` (usecases/stores), `domain` (entities/services), `infrastructure` (repositories). Frontend files under `src/lib/presentation/components` and `src/routes` must follow these Svelte conventions.
- Naming: event handler props use camelCase with `on` prefix and follow `on<Target><Action>` (e.g., `onGroupNameChange`).

When generating or validating Svelte code for this project, produce concise code that follows these rules and the repository's TypeScript style. Keep comments brief and avoid long paragraphs.

## TypeScript coding style

- Imports
  - Always import project code under `src/lib` using the `$lib` alias (e.g. `import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';`). Do not use relative paths like `../../lib/...`.
- Functions and declarations
  - Top-level functions: use `function` declarations for main/utility functions for clarity and hoisting.
  - Callbacks and short anonymous helpers: use `const fn = (...) => {}` arrow functions.
  - Group related methods in an object literal and use normal method syntax when exposing a feature set (repositories, services, stores).
- Naming
  - Use camelCase for function and variable names. Event/callback props use `on` prefix (camelCase) when exposed in components.
- Immutability
  - Prefer `readonly` on entity/type properties and `readonly` arrays in signatures and return types. Treat data as immutable: return new objects/arrays when updating (spread, map, filter).
  - If mutation is necessary, operate on a local copy (e.g. `const copy = [...items]`) and return an immutable value.
- Types and examples (short)
  - Prefer explicit types on public APIs. Example patterns:
    - `type Episode = { readonly id: number; readonly title: string; }`
    - `function getEpisodes(): Promise<readonly Episode[]> { ... }`
- Style and errors
  - Keep functions small and focused. Prefer clear names and explicit typing on boundaries. Follow repository linting and formatting rules.

When producing or validating TypeScript in this repo follow these rules.

## Testing Guidelines

Three test layers are provided:

### 1. Unit Tests (`*.test.ts`)

- **Location**: Next to the code being tested
- **Target**: Domain services, pure functions
- **Environment**: Node.js (jsdom)
- **Run**: `npm run test:unit`
- **Scope**: Small, focused tests (happy path + 1-2 edge cases)

### 2. Browser Mode Tests (`*.browser.test.ts`)

- **Location**:
  - Component tests: next to components
  - **Route integration tests** (primary focus): `integration.browser.test.ts` in each route directory
- **Target**: Frontend integration, page-level workflows
- **Environment**: Real browser (Chrome via WebdriverIO)
- **Run**: `npm run test:browser`
- **Mocking**: Tauri (Rust) modules mocked via Vitest's `vi.mock()`. Use shared factories from `src/lib/testing/mockFactories.ts`.

**Requirements:**

- Import `$src/app.css` for styling
- Reset stores/mocks in `beforeEach`
- **Always** call `await page.screenshot()` at end of each test

### 3. E2E Tests (`*.e2e.ts`)

For integration testing of the complete Tauri application, this repository provides an E2E test environment using WebdriverIO + Mocha.

- **Location**: `e2e-tests/specs/`
- **Target**: Full app stack (frontend + Tauri backend + Rust commands)
- **Environment**: Real Tauri application
- **Details**: See `e2e-tests/README.md`

### Test Selection Guide

- Domain logic → Unit tests
- Frontend integration (page workflows) → Browser mode integration tests
- Individual components → Browser mode component tests
- Full stack validation → E2E tests

## AI Agent Guidelines

Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Check: `npm run check`
- Format: `npm run format`
- Test unit: `npm run test:unit`
- Test browser: `npm run test:browser`
- Test all: `npm run test:all`
- Test single file: `npx vitest <path_to_test_file> run` (example: `npx vitest src/lib/domain/services/buildEpisodeGroupTree.test.ts run`)

Work rules for tasks

- Start in "Plan mode" without making any file changes: summarize the work plan and open questions. After that, stop and wait for explicit instruction to proceed. (Do not modify files during Plan mode.)
- After being instructed to start work, exit Plan mode and begin edits.
- After creating or editing files under `src/`, run `npm run format` to format code.
- After creating or editing files under `src/`, run `npm run lint` to check for linter errors.
- After creating or editing files under `src/`, run `npm run check` to detect SvelteKit type/check errors.
- When setting up a fresh Git worktree environment as an AI agent, install dependencies with `npm ci` (not `npm install`) to keep `package-lock.json` unchanged.
- When adding or modifying tests, first describe the test changes in natural language and stop (do not run tests yet). Then wait for explicit permission to proceed.

Additional Coding rules

- Use console for logging output in frontend code.
  - In TypeScript, use console.log, console.info, console.warn, console.error.
  - In `src/lib/domain/services/*.ts` files, avoid logging so unit tests under Vitest remain clean.
  - In Rust code, use: `use log::{info, warn, error};`.

Special notes

- Use `serena` for code analysis and editing when available.
- Svelte/SvelteKit rules: avoid using legacy event binding notation like `on:click`; use native `onclick` in Svelte 5.
