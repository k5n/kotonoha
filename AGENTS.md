# Kotonoha

## Overview

Kotonoha is a desktop application that helps language learners transform audio/video and transcript content into context-rich study materials using AI-powered "sentence mining". Users import pairs of audio/video files and corresponding transcripts. The app highlights sentences in their original context, lets learners mark sentences or expressions to analyze, and uses an LLM to extract key vocabulary, idioms, and explanatory notes which are saved as study cards (Anki-friendly CSV export supported).

## Technical summary

- Tech stack & architecture
  - Frontend: Svelte 5 + SvelteKit (TypeScript). Use Svelte Runes (`$state`, `$effect`, etc.) and SvelteKit `load` conventions.
  - Desktop framework: Tauri (Rust backend). Rust implements LLM calls, Stronghold-based secret storage, audio processing, and other system integrations.
  - DB: SQLite (accessed via Tauri SQL plugin). App uses file-based DBs: `dev.db` for development and `app.db` for release.
- Layered architecture
  - Overview: Kotonoha follows a four-layer, one-way dependency architecture: Presentation → Application, Application → Domain, Application → Infrastructure. Each layer has a focused responsibility and communicates only with lower layers through well-defined interfaces.
  - One notable exception: the domain/entities package is intentionally referenced by all other layers. While the architecture enforces one-way dependencies between Presentation, Application, Domain, and Infrastructure, domain entities represent the canonical data models and business concepts that must be shared project-wide. To avoid cyclic dependencies, entities must remain pure — contain no side effects, framework-specific imports, or dependencies on higher layers
  - Rationale: This structure keeps UI concerns separate from business rules and infrastructure details, makes domain logic highly testable, and allows the Rust/Tauri backend to evolve independently of the frontend UI.
- Key Tauri commands
  - `analyze_sentence_with_llm(api_key: String, learning_language: String, explanation_language: String, part_of_speech_options: Vec<String>, context: String, target_sentence: String) -> SentenceMiningResult`
  - `get_stronghold_password() -> Result<String, String>`
  - Audio commands: `open_audio(path: String)`, `analyze_audio(path: String, max_peaks: usize) -> AudioInfo(duration, peaks)`, `play_audio()`, `pause_audio()`, `resume_audio()`, `stop_audio()`, `seek_audio(position_ms: u32)`, `copy_audio_file(src_path: String, dest_path: String)`
  - Utility: `read_text_file(path: String) -> Result<String, String>`
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

## Frontend dependency graph

```mermaid
graph LR
        subgraph "lib"
            subgraph "application"
                subgraph "locales"
                    src_lib_application_locales_en_ts["en.ts"]
                    src_lib_application_locales_ja_ts["ja.ts"]
                end
                subgraph "stores"
                    src_lib_application_stores_apiKeyStore_svelte_ts["apiKeyStore.svelte.ts"]
                    src_lib_application_stores_audioInfoCacheStore_svelte_ts["audioInfoCacheStore.svelte.ts"]
                    src_lib_application_stores_groupPathStore_svelte_ts["groupPathStore.svelte.ts"]
                    src_lib_application_stores_i18n_svelte_ts["i18n.svelte.ts"]
                    src_lib_application_stores_mediaPlayerStore_svelte_ts["mediaPlayerStore.svelte.ts"]
                end
                subgraph "usecases"
                    src_lib_application_usecases_addEpisodeGroup_ts["addEpisodeGroup.ts"]
                    src_lib_application_usecases_addNewEpisode_ts["addNewEpisode.ts"]
                    src_lib_application_usecases_addSentenceCards_ts["addSentenceCards.ts"]
                    src_lib_application_usecases_analyzeDialogueForMining_ts["analyzeDialogueForMining.ts"]
                    src_lib_application_usecases_deleteEpisode_ts["deleteEpisode.ts"]
                    src_lib_application_usecases_deleteGroupRecursive_ts["deleteGroupRecursive.ts"]
                    src_lib_application_usecases_fetchAlbumGroups_ts["fetchAlbumGroups.ts"]
                    src_lib_application_usecases_fetchAppInfo_ts["fetchAppInfo.ts"]
                    src_lib_application_usecases_fetchAvailableParentGroups_ts["fetchAvailableParentGroups.ts"]
                    src_lib_application_usecases_fetchEpisodeDetail_ts["fetchEpisodeDetail.ts"]
                    src_lib_application_usecases_fetchEpisodeGroups_ts["fetchEpisodeGroups.ts"]
                    src_lib_application_usecases_fetchEpisodes_ts["fetchEpisodes.ts"]
                    src_lib_application_usecases_fetchSettings_ts["fetchSettings.ts"]
                    src_lib_application_usecases_fetchYoutubeMetadata_ts["fetchYoutubeMetadata.ts"]
                    src_lib_application_usecases_initializeApplication_ts["initializeApplication.ts"]
                    src_lib_application_usecases_moveEpisode_ts["moveEpisode.ts"]
                    src_lib_application_usecases_moveEpisodeGroup_ts["moveEpisodeGroup.ts"]
                    src_lib_application_usecases_previewScriptFile_ts["previewScriptFile.ts"]
                    src_lib_application_usecases_saveSettings_ts["saveSettings.ts"]
                    src_lib_application_usecases_softDeleteDialogue_ts["softDeleteDialogue.ts"]
                    src_lib_application_usecases_undoSoftDeleteDialogue_ts["undoSoftDeleteDialogue.ts"]
                    src_lib_application_usecases_updateDialogue_ts["updateDialogue.ts"]
                    src_lib_application_usecases_updateEpisodeGroupName_ts["updateEpisodeGroupName.ts"]
                    src_lib_application_usecases_updateEpisodeGroupsOrder_ts["updateEpisodeGroupsOrder.ts"]
                    src_lib_application_usecases_updateEpisodeName_ts["updateEpisodeName.ts"]
                    src_lib_application_usecases_updateEpisodesOrder_ts["updateEpisodesOrder.ts"]
                    subgraph "mediaPlayer"
                        src_lib_application_usecases_mediaPlayer_audioPlayer_ts["audioPlayer.ts"]
                        src_lib_application_usecases_mediaPlayer_mediaPlayer_ts["mediaPlayer.ts"]
                        src_lib_application_usecases_mediaPlayer_youtubePlayer_ts["youtubePlayer.ts"]
                    end
                end
            end
            subgraph "domain"
                subgraph "entities"
                    src_lib_domain_entities_appInfo_ts["appInfo.ts"]
                    src_lib_domain_entities_audioInfo_ts["audioInfo.ts"]
                    src_lib_domain_entities_dialogue_ts["dialogue.ts"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                    src_lib_domain_entities_scriptPreview_ts["scriptPreview.ts"]
                    src_lib_domain_entities_sentenceAnalysisResult_ts["sentenceAnalysisResult.ts"]
                    src_lib_domain_entities_sentenceCard_ts["sentenceCard.ts"]
                    src_lib_domain_entities_settings_ts["settings.ts"]
                    src_lib_domain_entities_youtubeMetadata_ts["youtubeMetadata.ts"]
                end
                subgraph "services"
                    src_lib_domain_services_buildEpisodeGroupTree_ts["buildEpisodeGroupTree.ts"]
                    src_lib_domain_services_generateEpisodeFilenames_ts["generateEpisodeFilenames.ts"]
                    src_lib_domain_services_groupTreeHelper_ts["groupTreeHelper.ts"]
                    src_lib_domain_services_parseScriptPreview_ts["parseScriptPreview.ts"]
                    src_lib_domain_services_parseSrtToDialogues_ts["parseSrtToDialogues.ts"]
                    src_lib_domain_services_parseSswtToDialogues_ts["parseSswtToDialogues.ts"]
                    src_lib_domain_services_parseTsvToDialogues_ts["parseTsvToDialogues.ts"]
                    src_lib_domain_services_parseVttToDialogues_ts["parseVttToDialogues.ts"]
                    src_lib_domain_services_youtubeUrlValidator_ts["youtubeUrlValidator.ts"]
                end
            end
            subgraph "infrastructure"
                src_lib_infrastructure_config_ts["config.ts"]
                subgraph "repositories"
                    src_lib_infrastructure_repositories_apiKeyRepository_ts["apiKeyRepository.ts"]
                    src_lib_infrastructure_repositories_appInfoRepository_ts["appInfoRepository.ts"]
                    src_lib_infrastructure_repositories_audioRepository_ts["audioRepository.ts"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                    src_lib_infrastructure_repositories_llmRepository_ts["llmRepository.ts"]
                    src_lib_infrastructure_repositories_sentenceCardRepository_ts["sentenceCardRepository.ts"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                    src_lib_infrastructure_repositories_youtubeRepository_ts["youtubeRepository.ts"]
                end
            end
            subgraph "presentation"
                subgraph "actions"
                    src_lib_presentation_actions_keyboardShortcuts_ts["keyboardShortcuts.ts"]
                end
                subgraph "components"
                    src_lib_presentation_components_AudioPlayer_svelte["AudioPlayer.svelte"]
                    src_lib_presentation_components_Breadcrumbs_svelte["Breadcrumbs.svelte"]
                    src_lib_presentation_components_ConfirmModal_svelte["ConfirmModal.svelte"]
                    src_lib_presentation_components_EpisodeAddModal_svelte["EpisodeAddModal.svelte"]
                    src_lib_presentation_components_EpisodeListTable_svelte["EpisodeListTable.svelte"]
                    src_lib_presentation_components_EpisodeMoveModal_svelte["EpisodeMoveModal.svelte"]
                    src_lib_presentation_components_EpisodeNameEditModal_svelte["EpisodeNameEditModal.svelte"]
                    src_lib_presentation_components_FileEpisodeForm_svelte["FileEpisodeForm.svelte"]
                    src_lib_presentation_components_FileSelect_svelte["FileSelect.svelte"]
                    src_lib_presentation_components_GroupAddModal_svelte["GroupAddModal.svelte"]
                    src_lib_presentation_components_GroupGrid_svelte["GroupGrid.svelte"]
                    src_lib_presentation_components_GroupMoveModal_svelte["GroupMoveModal.svelte"]
                    src_lib_presentation_components_GroupNameEditModal_svelte["GroupNameEditModal.svelte"]
                    src_lib_presentation_components_SentenceCardList_svelte["SentenceCardList.svelte"]
                    src_lib_presentation_components_SentenceMiningModal_svelte["SentenceMiningModal.svelte"]
                    src_lib_presentation_components_TranscriptViewer_svelte["TranscriptViewer.svelte"]
                    src_lib_presentation_components_TsvConfigSection_svelte["TsvConfigSection.svelte"]
                    src_lib_presentation_components_YoutubeEpisodeForm_svelte["YoutubeEpisodeForm.svelte"]
                end
                subgraph "types"
                    src_lib_presentation_types_episodeAddPayload_ts["episodeAddPayload.ts"]
                end
                subgraph "utils"
                    src_lib_presentation_utils_dateFormatter_ts["dateFormatter.ts"]
                end
            end
            subgraph "utils"
                src_lib_utils_language_ts["language.ts"]
                src_lib_utils_logging_ts["logging.ts"]
            end
        end
        subgraph "routes"
            subgraph "[...groupId]"
                src_routes_____groupId___page_svelte["+page.svelte"]
                src_routes_____groupId___page_ts["+page.ts"]
            end
            subgraph "episode"
                subgraph "[id]"
                    src_routes_episode__id___page_svelte["+page.svelte"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
            subgraph "episode-list"
                subgraph "[groupId]"
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                    src_routes_episode_list__groupId___page_ts["+page.ts"]
                end
            end
            src_routes__layout_svelte["+layout.svelte"]
            src_routes__layout_ts["+layout.ts"]
            subgraph "settings"
                src_routes_settings__page_svelte["+page.svelte"]
                src_routes_settings__page_ts["+page.ts"]
            end
        end
src_lib_application_stores_audioInfoCacheStore_svelte_ts --> src_lib_domain_entities_audioInfo_ts
src_lib_application_stores_groupPathStore_svelte_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_stores_i18n_svelte_ts --> src_lib_application_locales_en_ts
src_lib_application_stores_i18n_svelte_ts --> src_lib_application_locales_ja_ts
src_lib_application_usecases_addEpisodeGroup_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_addEpisodeGroup_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_entities_dialogue_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_entities_youtubeMetadata_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_generateEpisodeFilenames_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_parseSrtToDialogues_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_parseSswtToDialogues_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_parseTsvToDialogues_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_parseVttToDialogues_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_youtubeUrlValidator_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_fileRepository_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_youtubeRepository_ts
src_lib_application_usecases_addNewEpisode_ts --> src_lib_utils_language_ts
src_lib_application_usecases_addSentenceCards_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_domain_entities_dialogue_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_llmRepository_ts
src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_fileRepository_ts
src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_application_usecases_deleteEpisode_ts
src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_domain_services_groupTreeHelper_ts
src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_fetchAlbumGroups_ts --> src_lib_domain_services_buildEpisodeGroupTree_ts
src_lib_application_usecases_fetchAlbumGroups_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_fetchAppInfo_ts --> src_lib_domain_entities_appInfo_ts
src_lib_application_usecases_fetchAppInfo_ts --> src_lib_infrastructure_repositories_appInfoRepository_ts
src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_services_buildEpisodeGroupTree_ts
src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_services_groupTreeHelper_ts
src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_dialogue_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_episode_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_sentenceCard_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
src_lib_application_usecases_fetchEpisodeGroups_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_fetchEpisodeGroups_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_fetchEpisodes_ts --> src_lib_domain_entities_episode_ts
src_lib_application_usecases_fetchEpisodes_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_fetchEpisodes_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_fetchEpisodes_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_fetchSettings_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
src_lib_application_usecases_fetchSettings_ts --> src_lib_domain_entities_settings_ts
src_lib_application_usecases_fetchSettings_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
src_lib_application_usecases_fetchSettings_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_domain_entities_youtubeMetadata_ts
src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_domain_services_youtubeUrlValidator_ts
src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_infrastructure_repositories_youtubeRepository_ts
src_lib_application_usecases_initializeApplication_ts --> src_lib_application_stores_i18n_svelte_ts
src_lib_application_usecases_initializeApplication_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_stores_audioInfoCacheStore_svelte_ts
src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_stores_mediaPlayerStore_svelte_ts
src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_domain_entities_audioInfo_ts
src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_infrastructure_repositories_audioRepository_ts
src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_application_stores_mediaPlayerStore_svelte_ts
src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_domain_services_youtubeUrlValidator_ts
src_lib_application_usecases_moveEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_domain_services_groupTreeHelper_ts
src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_previewScriptFile_ts --> src_lib_domain_entities_scriptPreview_ts
src_lib_application_usecases_previewScriptFile_ts --> src_lib_domain_services_parseScriptPreview_ts
src_lib_application_usecases_previewScriptFile_ts --> src_lib_infrastructure_repositories_fileRepository_ts
src_lib_application_usecases_saveSettings_ts --> src_lib_application_stores_i18n_svelte_ts
src_lib_application_usecases_saveSettings_ts --> src_lib_domain_entities_settings_ts
src_lib_application_usecases_saveSettings_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
src_lib_application_usecases_saveSettings_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
src_lib_application_usecases_softDeleteDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_undoSoftDeleteDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_updateDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
src_lib_application_usecases_updateEpisodeGroupName_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_updateEpisodeGroupName_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_updateEpisodeGroupsOrder_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_application_usecases_updateEpisodeGroupsOrder_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
src_lib_application_usecases_updateEpisodeName_ts --> src_lib_domain_entities_episode_ts
src_lib_application_usecases_updateEpisodeName_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_application_usecases_updateEpisodesOrder_ts --> src_lib_domain_entities_episode_ts
src_lib_application_usecases_updateEpisodesOrder_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
src_lib_domain_entities_sentenceAnalysisResult_ts --> src_lib_domain_entities_sentenceCard_ts
src_lib_domain_services_buildEpisodeGroupTree_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_domain_services_groupTreeHelper_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_domain_services_parseScriptPreview_ts --> src_lib_domain_entities_scriptPreview_ts
src_lib_domain_services_parseSrtToDialogues_ts --> src_lib_domain_entities_dialogue_ts
src_lib_domain_services_parseSswtToDialogues_ts --> src_lib_domain_entities_dialogue_ts
src_lib_domain_services_parseTsvToDialogues_ts --> src_lib_domain_entities_dialogue_ts
src_lib_domain_services_parseVttToDialogues_ts --> src_lib_domain_entities_dialogue_ts
src_lib_infrastructure_repositories_appInfoRepository_ts --> src_lib_domain_entities_appInfo_ts
src_lib_infrastructure_repositories_audioRepository_ts --> src_lib_domain_entities_audioInfo_ts
src_lib_infrastructure_repositories_dialogueRepository_ts --> src_lib_domain_entities_dialogue_ts
src_lib_infrastructure_repositories_dialogueRepository_ts --> src_lib_infrastructure_config_ts
src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_infrastructure_config_ts
src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_infrastructure_config_ts
src_lib_infrastructure_repositories_fileRepository_ts --> src_lib_infrastructure_config_ts
src_lib_infrastructure_repositories_llmRepository_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
src_lib_infrastructure_repositories_sentenceCardRepository_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
src_lib_infrastructure_repositories_sentenceCardRepository_ts --> src_lib_domain_entities_sentenceCard_ts
src_lib_infrastructure_repositories_sentenceCardRepository_ts --> src_lib_infrastructure_config_ts
src_lib_infrastructure_repositories_settingsRepository_ts --> src_lib_domain_entities_settings_ts
src_lib_infrastructure_repositories_youtubeRepository_ts --> src_lib_domain_entities_dialogue_ts
src_lib_infrastructure_repositories_youtubeRepository_ts --> src_lib_domain_entities_youtubeMetadata_ts
src_lib_presentation_actions_keyboardShortcuts_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
src_lib_presentation_actions_keyboardShortcuts_ts --> src_lib_domain_entities_dialogue_ts
src_lib_presentation_components_Breadcrumbs_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_Breadcrumbs_svelte --> src_lib_domain_entities_episodeGroup_ts
src_lib_presentation_components_ConfirmModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_EpisodeAddModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_EpisodeAddModal_svelte --> src_lib_domain_entities_youtubeMetadata_ts
src_lib_presentation_components_EpisodeAddModal_svelte --> src_lib_presentation_components_FileEpisodeForm_svelte
src_lib_presentation_components_EpisodeAddModal_svelte --> src_lib_presentation_components_YoutubeEpisodeForm_svelte
src_lib_presentation_components_EpisodeAddModal_svelte --> src_lib_presentation_types_episodeAddPayload_ts
src_lib_presentation_components_EpisodeListTable_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_EpisodeListTable_svelte --> src_lib_domain_entities_episode_ts
src_lib_presentation_components_EpisodeListTable_svelte --> src_lib_presentation_utils_dateFormatter_ts
src_lib_presentation_components_EpisodeMoveModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_EpisodeMoveModal_svelte --> src_lib_domain_entities_episode_ts
src_lib_presentation_components_EpisodeMoveModal_svelte --> src_lib_domain_entities_episodeGroup_ts
src_lib_presentation_components_EpisodeNameEditModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_application_usecases_previewScriptFile_ts
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_domain_entities_scriptPreview_ts
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_presentation_components_FileSelect_svelte
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_presentation_components_TsvConfigSection_svelte
src_lib_presentation_components_FileEpisodeForm_svelte --> src_lib_presentation_types_episodeAddPayload_ts
src_lib_presentation_components_FileSelect_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_GroupAddModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_GroupAddModal_svelte --> src_lib_domain_entities_episodeGroup_ts
src_lib_presentation_components_GroupGrid_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_GroupGrid_svelte --> src_lib_domain_entities_episodeGroup_ts
src_lib_presentation_components_GroupMoveModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_GroupMoveModal_svelte --> src_lib_domain_entities_episodeGroup_ts
src_lib_presentation_components_GroupNameEditModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_SentenceCardList_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_SentenceCardList_svelte --> src_lib_domain_entities_sentenceCard_ts
src_lib_presentation_components_SentenceCardList_svelte --> src_lib_presentation_utils_dateFormatter_ts
src_lib_presentation_components_SentenceMiningModal_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_SentenceMiningModal_svelte --> src_lib_domain_entities_dialogue_ts
src_lib_presentation_components_SentenceMiningModal_svelte --> src_lib_domain_entities_sentenceAnalysisResult_ts
src_lib_presentation_components_TranscriptViewer_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_TranscriptViewer_svelte --> src_lib_domain_entities_dialogue_ts
src_lib_presentation_components_TsvConfigSection_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_TsvConfigSection_svelte --> src_lib_domain_entities_scriptPreview_ts
src_lib_presentation_components_YoutubeEpisodeForm_svelte --> src_lib_application_stores_i18n_svelte_ts
src_lib_presentation_components_YoutubeEpisodeForm_svelte --> src_lib_domain_entities_youtubeMetadata_ts
src_lib_presentation_components_YoutubeEpisodeForm_svelte --> src_lib_presentation_types_episodeAddPayload_ts
src_lib_presentation_components_YoutubeEpisodeForm_svelte --> src_lib_utils_language_ts
src_lib_presentation_types_episodeAddPayload_ts --> src_lib_domain_entities_youtubeMetadata_ts
src_routes__layout_ts --> src_lib_application_usecases_initializeApplication_ts
src_routes_____groupId___page_svelte --> src_lib_application_stores_groupPathStore_svelte_ts
src_routes_____groupId___page_svelte --> src_lib_application_stores_i18n_svelte_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_addEpisodeGroup_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_deleteGroupRecursive_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_fetchAvailableParentGroups_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_moveEpisodeGroup_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_updateEpisodeGroupName_ts
src_routes_____groupId___page_svelte --> src_lib_application_usecases_updateEpisodeGroupsOrder_ts
src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
src_routes_____groupId___page_svelte --> src_lib_presentation_components_Breadcrumbs_svelte
src_routes_____groupId___page_svelte --> src_lib_presentation_components_ConfirmModal_svelte
src_routes_____groupId___page_svelte --> src_lib_presentation_components_GroupAddModal_svelte
src_routes_____groupId___page_svelte --> src_lib_presentation_components_GroupGrid_svelte
src_routes_____groupId___page_svelte --> src_lib_presentation_components_GroupMoveModal_svelte
src_routes_____groupId___page_svelte --> src_lib_presentation_components_GroupNameEditModal_svelte
src_routes_____groupId___page_ts --> src_lib_application_usecases_fetchEpisodeGroups_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_stores_groupPathStore_svelte_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_stores_i18n_svelte_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_addNewEpisode_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_deleteEpisode_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_fetchAlbumGroups_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_fetchYoutubeMetadata_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_moveEpisode_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_updateEpisodeName_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_updateEpisodesOrder_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_episode_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_youtubeMetadata_ts
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_Breadcrumbs_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_ConfirmModal_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_EpisodeAddModal_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_EpisodeListTable_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_EpisodeMoveModal_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_EpisodeNameEditModal_svelte
src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_types_episodeAddPayload_ts
src_routes_episode_list__groupId___page_ts --> src_lib_application_usecases_fetchEpisodes_ts
src_routes_episode_list__groupId___page_ts --> src_lib_domain_entities_episode_ts
src_routes_episode__id___page_svelte --> src_lib_application_stores_i18n_svelte_ts
src_routes_episode__id___page_svelte --> src_lib_application_stores_mediaPlayerStore_svelte_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_addSentenceCards_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_analyzeDialogueForMining_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_mediaPlayer_youtubePlayer_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_softDeleteDialogue_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_undoSoftDeleteDialogue_ts
src_routes_episode__id___page_svelte --> src_lib_application_usecases_updateDialogue_ts
src_routes_episode__id___page_svelte --> src_lib_domain_entities_dialogue_ts
src_routes_episode__id___page_svelte --> src_lib_domain_entities_sentenceAnalysisResult_ts
src_routes_episode__id___page_svelte --> src_lib_domain_entities_sentenceCard_ts
src_routes_episode__id___page_svelte --> src_lib_presentation_actions_keyboardShortcuts_ts
src_routes_episode__id___page_svelte --> src_lib_presentation_components_AudioPlayer_svelte
src_routes_episode__id___page_svelte --> src_lib_presentation_components_ConfirmModal_svelte
src_routes_episode__id___page_svelte --> src_lib_presentation_components_SentenceCardList_svelte
src_routes_episode__id___page_svelte --> src_lib_presentation_components_SentenceMiningModal_svelte
src_routes_episode__id___page_svelte --> src_lib_presentation_components_TranscriptViewer_svelte
src_routes_episode__id___page_ts --> src_lib_application_usecases_fetchEpisodeDetail_ts
src_routes_episode__id___page_ts --> src_lib_application_usecases_fetchSettings_ts
src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_audioPlayer_ts
src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_youtubePlayer_ts
src_routes_episode__id___page_ts --> src_lib_domain_entities_audioInfo_ts
src_routes_settings__page_svelte --> src_lib_application_stores_i18n_svelte_ts
src_routes_settings__page_svelte --> src_lib_application_usecases_saveSettings_ts
src_routes_settings__page_ts --> src_lib_application_usecases_fetchAppInfo_ts
src_routes_settings__page_ts --> src_lib_application_usecases_fetchSettings_ts
```

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

- Placement: Keep frontend test files next to the code they test. Place a test file named `*.test.ts` alongside the corresponding `*.ts` source file under `src/`.
- Framework: Use Vitest for tests. The repository is configured to enable Vitest `globals`, so tests can use `describe`, `it`, `test`, and `expect` without importing them.
- Minimal scope for agents: When adding or updating tests, keep them focused and small (happy path plus 1–2 edge cases). Prefer unit tests for `src/lib/domain` services and lightweight integration tests for application logic.
- Reporting: When you update or add tests, include which cases are covered (happy path, empty input, error path) and any assumptions.

These guidelines keep test code predictable and make it easy for automated agents to reason about and run tests in this repository.

## AI Agent Guidelines

Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Check: `npm run check`
- Format: `npm run format`
- Test all: `npm run test`
- Test single file: `npx vitest <path_to_test_file> run` (example: `npx vitest src/lib/domain/services/buildEpisodeGroupTree.test.ts run`)

Work rules for tasks

- Start in "Plan mode" without making any file changes: summarize the work plan and open questions. After that, stop and wait for explicit instruction to proceed. (Do not modify files during Plan mode.)
- After being instructed to start work, exit Plan mode and begin edits.
- After creating or editing files, run `npm run format` to format code.
- After creating or editing files, run `npm run lint` to check for linter errors.
- After creating or editing files, run `npm run check` to detect SvelteKit type/check errors.
- When adding or modifying tests, first describe the test changes in natural language and stop (do not run tests yet). Then wait for explicit permission to proceed.

Additional Coding rules

- Use Tauri's `log` plugin for logging output.
  - In TypeScript use: `import { info, warn, error } from '@tauri-apps/plugin-log';`.
  - In `src/lib/domain/services/*.ts` files, avoid logging so unit tests under Vitest remain clean.
  - In Rust code, use: `use log::{info, warn, error};`.

Special notes

- Use `serena` for code analysis and editing when available.
- Svelte/SvelteKit rules: avoid using legacy event binding notation like `on:click`; use native `onclick` in Svelte 5.
