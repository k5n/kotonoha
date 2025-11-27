# Frontend Dependency Graphs

# Presentation Layer Dependency Graph

Note: `src/lib/application/stores/i18n.svelte.ts` is omitted from presentation graphs to reduce noise.

### Screen: /[...groupId]

Dependencies for the `/[...groupId]` screen.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_groupPathStore_svelte_ts["groupPathStore.svelte.ts"]
                end
            end
            subgraph sg_lib_presentation ["presentation"]
                subgraph sg_lib_presentation_components ["components"]
                    subgraph sg_lib_presentation_components_presentational ["presentational"]
                        src_lib_presentation_components_presentational_Breadcrumbs_svelte["Breadcrumbs.svelte"]
                        src_lib_presentation_components_presentational_ConfirmModal_svelte["ConfirmModal.svelte"]
                        src_lib_presentation_components_presentational_EmptyStateDisplay_svelte["EmptyStateDisplay.svelte"]
                        src_lib_presentation_components_presentational_ErrorWarningToast_svelte["ErrorWarningToast.svelte"]
                        src_lib_presentation_components_presentational_LoadErrorAlert_svelte["LoadErrorAlert.svelte"]
                        src_lib_presentation_components_presentational_PageLoadingSpinner_svelte["PageLoadingSpinner.svelte"]
                    end
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
                subgraph sg_routes_____groupId__presentational ["presentational"]
                    src_routes_____groupId__presentational_GroupAddModal_svelte["GroupAddModal.svelte"]
                    src_routes_____groupId__presentational_GroupGrid_svelte["GroupGrid.svelte"]
                    src_routes_____groupId__presentational_GroupMoveModal_svelte["GroupMoveModal.svelte"]
                    src_routes_____groupId__presentational_GroupNameEditModal_svelte["GroupNameEditModal.svelte"]
                end
            end
        end
    src_routes_____groupId___page_svelte --> src_lib_application_stores_groupPathStore_svelte_ts
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_Breadcrumbs_svelte
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_ConfirmModal_svelte
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_EmptyStateDisplay_svelte
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_ErrorWarningToast_svelte
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_LoadErrorAlert_svelte
    src_routes_____groupId___page_svelte --> src_lib_presentation_components_presentational_PageLoadingSpinner_svelte
    src_routes_____groupId___page_svelte --> src_routes_____groupId__presentational_GroupAddModal_svelte
    src_routes_____groupId___page_svelte --> src_routes_____groupId__presentational_GroupGrid_svelte
    src_routes_____groupId___page_svelte --> src_routes_____groupId__presentational_GroupMoveModal_svelte
    src_routes_____groupId___page_svelte --> src_routes_____groupId__presentational_GroupNameEditModal_svelte
```
### Screen: /episode-list/[groupId]

Dependencies for the `/episode-list/[groupId]` screen.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_fileBasedEpisodeAddStore_svelte_ts["fileBasedEpisodeAddStore.svelte.ts"]
                    src_lib_application_stores_groupPathStore_svelte_ts["groupPathStore.svelte.ts"]
                end
            end
            subgraph sg_lib_presentation ["presentation"]
                subgraph sg_lib_presentation_components ["components"]
                    subgraph sg_lib_presentation_components_presentational ["presentational"]
                        src_lib_presentation_components_presentational_Breadcrumbs_svelte["Breadcrumbs.svelte"]
                        src_lib_presentation_components_presentational_ConfirmModal_svelte["ConfirmModal.svelte"]
                        src_lib_presentation_components_presentational_EmptyStateDisplay_svelte["EmptyStateDisplay.svelte"]
                        src_lib_presentation_components_presentational_ErrorWarningToast_svelte["ErrorWarningToast.svelte"]
                        src_lib_presentation_components_presentational_FileSelect_svelte["FileSelect.svelte"]
                        src_lib_presentation_components_presentational_LoadErrorAlert_svelte["LoadErrorAlert.svelte"]
                        src_lib_presentation_components_presentational_PageLoadingSpinner_svelte["PageLoadingSpinner.svelte"]
                    end
                end
                subgraph sg_lib_presentation_utils ["utils"]
                    src_lib_presentation_utils_dateFormatter_ts["dateFormatter.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte["AudioScriptFileEpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte["EpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts["tsvConfigController.svelte.ts"]
                        src_routes_episode_list__groupId__container_ttsConfigController_svelte_ts["ttsConfigController.svelte.ts"]
                        src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte["TtsEpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts["ttsExecutionController.svelte.ts"]
                        src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts["ttsModelDownloadController.svelte.ts"]
                        src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte["YoutubeEpisodeAddContainer.svelte"]
                    end
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                    subgraph sg_routes_episode_list__groupId__presentational ["presentational"]
                        src_routes_episode_list__groupId__presentational_AudioFileSelect_svelte["AudioFileSelect.svelte"]
                        src_routes_episode_list__groupId__presentational_EpisodeListTable_svelte["EpisodeListTable.svelte"]
                        src_routes_episode_list__groupId__presentational_EpisodeMoveModal_svelte["EpisodeMoveModal.svelte"]
                        src_routes_episode_list__groupId__presentational_EpisodeNameEditModal_svelte["EpisodeNameEditModal.svelte"]
                        src_routes_episode_list__groupId__presentational_EpisodeSourceSelectionModal_svelte["EpisodeSourceSelectionModal.svelte"]
                        src_routes_episode_list__groupId__presentational_FileEpisodeModal_svelte["FileEpisodeModal.svelte"]
                        src_routes_episode_list__groupId__presentational_ScriptFileSelect_svelte["ScriptFileSelect.svelte"]
                        src_routes_episode_list__groupId__presentational_TsvConfigSection_svelte["TsvConfigSection.svelte"]
                        src_routes_episode_list__groupId__presentational_TtsConfigSection_svelte["TtsConfigSection.svelte"]
                        src_routes_episode_list__groupId__presentational_TtsExecutionModal_svelte["TtsExecutionModal.svelte"]
                        src_routes_episode_list__groupId__presentational_TtsModelDownloadModal_svelte["TtsModelDownloadModal.svelte"]
                        src_routes_episode_list__groupId__presentational_YoutubeEpisodeAddModal_svelte["YoutubeEpisodeAddModal.svelte"]
                    end
                end
            end
        end
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_stores_groupPathStore_svelte_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_Breadcrumbs_svelte
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_ConfirmModal_svelte
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_EmptyStateDisplay_svelte
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_ErrorWarningToast_svelte
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_LoadErrorAlert_svelte
    src_routes_episode_list__groupId___page_svelte --> src_lib_presentation_components_presentational_PageLoadingSpinner_svelte
    src_routes_episode_list__groupId___page_svelte --> src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte
    src_routes_episode_list__groupId___page_svelte --> src_routes_episode_list__groupId__presentational_EpisodeListTable_svelte
    src_routes_episode_list__groupId___page_svelte --> src_routes_episode_list__groupId__presentational_EpisodeMoveModal_svelte
    src_routes_episode_list__groupId___page_svelte --> src_routes_episode_list__groupId__presentational_EpisodeNameEditModal_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_application_stores_fileBasedEpisodeAddStore_svelte_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_EpisodeSourceSelectionModal_svelte
    src_routes_episode_list__groupId__presentational_EpisodeListTable_svelte --> src_lib_presentation_utils_dateFormatter_ts
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_lib_application_stores_fileBasedEpisodeAddStore_svelte_ts
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_AudioFileSelect_svelte
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_FileEpisodeModal_svelte
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_ScriptFileSelect_svelte
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_TsvConfigSection_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_lib_application_stores_fileBasedEpisodeAddStore_svelte_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_ttsConfigController_svelte_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_FileEpisodeModal_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_ScriptFileSelect_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_TsvConfigSection_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_TtsConfigSection_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_TtsExecutionModal_svelte
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_TtsModelDownloadModal_svelte
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_routes_episode_list__groupId__presentational_YoutubeEpisodeAddModal_svelte
    src_routes_episode_list__groupId__presentational_AudioFileSelect_svelte --> src_lib_presentation_components_presentational_FileSelect_svelte
    src_routes_episode_list__groupId__presentational_ScriptFileSelect_svelte --> src_lib_presentation_components_presentational_FileSelect_svelte
```
### Screen: /episode/[id]

Dependencies for the `/episode/[id]` screen.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_mediaPlayerStore_svelte_ts["mediaPlayerStore.svelte.ts"]
                end
            end
            subgraph sg_lib_presentation ["presentation"]
                subgraph sg_lib_presentation_actions ["actions"]
                    src_lib_presentation_actions_keyboardShortcuts_ts["keyboardShortcuts.ts"]
                end
                subgraph sg_lib_presentation_components ["components"]
                    subgraph sg_lib_presentation_components_presentational ["presentational"]
                        src_lib_presentation_components_presentational_ConfirmModal_svelte["ConfirmModal.svelte"]
                        src_lib_presentation_components_presentational_LoadErrorAlert_svelte["LoadErrorAlert.svelte"]
                    end
                end
                subgraph sg_lib_presentation_utils ["utils"]
                    src_lib_presentation_utils_dateFormatter_ts["dateFormatter.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                    subgraph sg_routes_episode__id__presentational ["presentational"]
                        src_routes_episode__id__presentational_AudioPlayer_svelte["AudioPlayer.svelte"]
                        src_routes_episode__id__presentational_SentenceCardList_svelte["SentenceCardList.svelte"]
                        src_routes_episode__id__presentational_SentenceMiningModal_svelte["SentenceMiningModal.svelte"]
                        src_routes_episode__id__presentational_TranscriptViewer_svelte["TranscriptViewer.svelte"]
                    end
                end
            end
        end
    src_routes_episode__id___page_svelte --> src_lib_application_stores_mediaPlayerStore_svelte_ts
    src_routes_episode__id___page_svelte --> src_lib_presentation_actions_keyboardShortcuts_ts
    src_routes_episode__id___page_svelte --> src_lib_presentation_components_presentational_ConfirmModal_svelte
    src_routes_episode__id___page_svelte --> src_lib_presentation_components_presentational_LoadErrorAlert_svelte
    src_routes_episode__id___page_svelte --> src_routes_episode__id__presentational_AudioPlayer_svelte
    src_routes_episode__id___page_svelte --> src_routes_episode__id__presentational_SentenceCardList_svelte
    src_routes_episode__id___page_svelte --> src_routes_episode__id__presentational_SentenceMiningModal_svelte
    src_routes_episode__id___page_svelte --> src_routes_episode__id__presentational_TranscriptViewer_svelte
    src_routes_episode__id__presentational_SentenceCardList_svelte --> src_lib_presentation_utils_dateFormatter_ts
```
### Screen: /settings

Dependencies for the `/settings` screen.

```mermaid
graph LR
        subgraph sg_routes ["routes"]
            subgraph sg_routes_settings ["settings"]
                src_routes_settings__page_svelte["+page.svelte"]
                subgraph sg_routes_settings_presentational ["presentational"]
                    src_routes_settings_presentational_AppInfoComponent_svelte["AppInfoComponent.svelte"]
                    src_routes_settings_presentational_LanguageSelectionModal_svelte["LanguageSelectionModal.svelte"]
                    src_routes_settings_presentational_SettingsComponent_svelte["SettingsComponent.svelte"]
                end
            end
        end
    src_routes_settings__page_svelte --> src_routes_settings_presentational_AppInfoComponent_svelte
    src_routes_settings__page_svelte --> src_routes_settings_presentational_SettingsComponent_svelte
    src_routes_settings_presentational_SettingsComponent_svelte --> src_routes_settings_presentational_LanguageSelectionModal_svelte
```

## Application Layer: Use Case Dependencies
### Use Case: addEpisodeGroup.ts

Shows files that use the `addEpisodeGroup.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_addEpisodeGroup_ts["addEpisodeGroup.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_addEpisodeGroup_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_addEpisodeGroup_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_addEpisodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: addNewEpisode.ts

Shows files that use the `addNewEpisode.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_addNewEpisode_ts["addNewEpisode.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                    src_lib_domain_entities_tsvConfig_ts["tsvConfig.ts"]
                    src_lib_domain_entities_youtubeMetadata_ts["youtubeMetadata.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_generateEpisodeFilenames_ts["generateEpisodeFilenames.ts"]
                    src_lib_domain_services_parseScriptToDialogues_ts["parseScriptToDialogues.ts"]
                    src_lib_domain_services_youtubeUrlValidator_ts["youtubeUrlValidator.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                    src_lib_infrastructure_repositories_youtubeRepository_ts["youtubeRepository.ts"]
                end
            end
            subgraph sg_lib_utils ["utils"]
                src_lib_utils_language_ts["language.ts"]
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte["AudioScriptFileEpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte["EpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte["TtsEpisodeAddContainer.svelte"]
                        src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte["YoutubeEpisodeAddContainer.svelte"]
                    end
                end
            end
        end
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_entities_episode_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_entities_tsvConfig_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_entities_youtubeMetadata_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_generateEpisodeFilenames_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_parseScriptToDialogues_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_domain_services_youtubeUrlValidator_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_fileRepository_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_infrastructure_repositories_youtubeRepository_ts
    src_lib_application_usecases_addNewEpisode_ts --> src_lib_utils_language_ts
    src_lib_domain_services_parseScriptToDialogues_ts --> src_lib_domain_entities_tsvConfig_ts
    src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
    src_lib_infrastructure_repositories_youtubeRepository_ts --> src_lib_domain_entities_youtubeMetadata_ts
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_lib_application_usecases_addNewEpisode_ts
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_lib_domain_entities_youtubeMetadata_ts
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_lib_utils_language_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_lib_application_usecases_addNewEpisode_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_lib_domain_entities_tsvConfig_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_application_usecases_addNewEpisode_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_domain_entities_episode_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_domain_entities_tsvConfig_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_lib_application_usecases_addNewEpisode_ts
    src_routes_episode_list__groupId__container_AudioScriptFileEpisodeAddContainer_svelte --> src_lib_domain_entities_tsvConfig_ts
```
### Use Case: addSentenceCards.ts

Shows files that use the `addSentenceCards.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_addSentenceCards_ts["addSentenceCards.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_sentenceCardRepository_ts["sentenceCardRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_addSentenceCards_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_addSentenceCards_ts
```
### Use Case: analyzeDialogueForMining.ts

Shows files that use the `analyzeDialogueForMining.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_apiKeyStore_svelte_ts["apiKeyStore.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_analyzeDialogueForMining_ts["analyzeDialogueForMining.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_dialogue_ts["dialogue.ts"]
                    src_lib_domain_entities_sentenceAnalysisResult_ts["sentenceAnalysisResult.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_apiKeyRepository_ts["apiKeyRepository.ts"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                    src_lib_infrastructure_repositories_llmRepository_ts["llmRepository.ts"]
                    src_lib_infrastructure_repositories_sentenceCardRepository_ts["sentenceCardRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_domain_entities_dialogue_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_llmRepository_ts
    src_lib_application_usecases_analyzeDialogueForMining_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
    src_lib_infrastructure_repositories_dialogueRepository_ts --> src_lib_domain_entities_dialogue_ts
    src_lib_infrastructure_repositories_llmRepository_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
    src_lib_infrastructure_repositories_sentenceCardRepository_ts --> src_lib_domain_entities_sentenceAnalysisResult_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_analyzeDialogueForMining_ts
    src_routes_episode__id___page_svelte --> src_lib_domain_entities_dialogue_ts
    src_routes_episode__id___page_svelte --> src_lib_domain_entities_sentenceAnalysisResult_ts
```
### Use Case: deleteEpisode.ts

Shows files that use the `deleteEpisode.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_deleteEpisode_ts["deleteEpisode.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                    src_lib_infrastructure_repositories_sentenceCardRepository_ts["sentenceCardRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_fileRepository_ts
    src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_deleteEpisode_ts
```
### Use Case: deleteGroupRecursive.ts

Shows files that use the `deleteGroupRecursive.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_deleteEpisode_ts["deleteEpisode.ts"]
                    src_lib_application_usecases_deleteGroupRecursive_ts["deleteGroupRecursive.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_groupTreeHelper_ts["groupTreeHelper.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_application_usecases_deleteEpisode_ts
    src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_domain_services_groupTreeHelper_ts
    src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_application_usecases_deleteGroupRecursive_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_domain_services_groupTreeHelper_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_deleteEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_deleteGroupRecursive_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: detectScriptLanguage.ts

Shows files that use the `detectScriptLanguage.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_detectScriptLanguage_ts["detectScriptLanguage.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_tsvConfig_ts["tsvConfig.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_extractScriptText_ts["extractScriptText.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                    src_lib_infrastructure_repositories_languageDetectionRepository_ts["languageDetectionRepository.ts"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                end
            end
            subgraph sg_lib_utils ["utils"]
                src_lib_utils_language_ts["language.ts"]
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte["EpisodeAddContainer.svelte"]
                    end
                end
            end
        end
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_domain_entities_tsvConfig_ts
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_domain_services_extractScriptText_ts
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_infrastructure_repositories_fileRepository_ts
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_infrastructure_repositories_languageDetectionRepository_ts
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
    src_lib_application_usecases_detectScriptLanguage_ts --> src_lib_utils_language_ts
    src_lib_domain_services_extractScriptText_ts --> src_lib_domain_entities_tsvConfig_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_application_usecases_detectScriptLanguage_ts
    src_routes_episode_list__groupId__container_EpisodeAddContainer_svelte --> src_lib_domain_entities_tsvConfig_ts
```
### Use Case: downloadTtsModel.ts

Shows files that use the `downloadTtsModel.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_downloadTtsModel_ts["downloadTtsModel.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_ttsEvent_ts["ttsEvent.ts"]
                    src_lib_domain_entities_voice_ts["voice.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_ttsRepository_ts["ttsRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts["ttsModelDownloadController.svelte.ts"]
                    end
                end
            end
        end
    src_lib_application_usecases_downloadTtsModel_ts --> src_lib_domain_entities_ttsEvent_ts
    src_lib_application_usecases_downloadTtsModel_ts --> src_lib_domain_entities_voice_ts
    src_lib_application_usecases_downloadTtsModel_ts --> src_lib_infrastructure_repositories_ttsRepository_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_ttsEvent_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_voice_ts
    src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts --> src_lib_application_usecases_downloadTtsModel_ts
    src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts --> src_lib_domain_entities_ttsEvent_ts
    src_routes_episode_list__groupId__container_ttsModelDownloadController_svelte_ts --> src_lib_domain_entities_voice_ts
```
### Use Case: executeTts.ts

Shows files that use the `executeTts.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_executeTts_ts["executeTts.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_tsvConfig_ts["tsvConfig.ts"]
                    src_lib_domain_entities_ttsEvent_ts["ttsEvent.ts"]
                    src_lib_domain_entities_ttsResult_ts["ttsResult.ts"]
                    src_lib_domain_entities_voice_ts["voice.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_extractScriptText_ts["extractScriptText.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                    src_lib_infrastructure_repositories_ttsRepository_ts["ttsRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts["ttsExecutionController.svelte.ts"]
                    end
                end
            end
        end
    src_lib_application_usecases_executeTts_ts --> src_lib_domain_entities_tsvConfig_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_domain_entities_ttsEvent_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_domain_entities_ttsResult_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_domain_entities_voice_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_domain_services_extractScriptText_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_infrastructure_repositories_fileRepository_ts
    src_lib_application_usecases_executeTts_ts --> src_lib_infrastructure_repositories_ttsRepository_ts
    src_lib_domain_services_extractScriptText_ts --> src_lib_domain_entities_tsvConfig_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_ttsEvent_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_ttsResult_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_voice_ts
    src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts --> src_lib_application_usecases_executeTts_ts
    src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts --> src_lib_domain_entities_tsvConfig_ts
    src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts --> src_lib_domain_entities_ttsEvent_ts
    src_routes_episode_list__groupId__container_ttsExecutionController_svelte_ts --> src_lib_domain_entities_voice_ts
```
### Use Case: fetchAppInfo.ts

Shows files that use the `fetchAppInfo.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchAppInfo_ts["fetchAppInfo.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_appInfo_ts["appInfo.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_appInfoRepository_ts["appInfoRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_settings ["settings"]
                src_routes_settings__page_ts["+page.ts"]
            end
        end
    src_lib_application_usecases_fetchAppInfo_ts --> src_lib_domain_entities_appInfo_ts
    src_lib_application_usecases_fetchAppInfo_ts --> src_lib_infrastructure_repositories_appInfoRepository_ts
    src_lib_infrastructure_repositories_appInfoRepository_ts --> src_lib_domain_entities_appInfo_ts
    src_routes_settings__page_ts --> src_lib_application_usecases_fetchAppInfo_ts
```
### Use Case: fetchAvailableParentGroups.ts

Shows files that use the `fetchAvailableParentGroups.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchAvailableParentGroups_ts["fetchAvailableParentGroups.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_buildEpisodeGroupTree_ts["buildEpisodeGroupTree.ts"]
                    src_lib_domain_services_groupTreeHelper_ts["groupTreeHelper.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_services_buildEpisodeGroupTree_ts
    src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_domain_services_groupTreeHelper_ts
    src_lib_application_usecases_fetchAvailableParentGroups_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_domain_services_buildEpisodeGroupTree_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_domain_services_groupTreeHelper_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_fetchAvailableParentGroups_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: fetchAvailableTargetGroupsForEpisodeMove.ts

Shows files that use the `fetchAvailableTargetGroupsForEpisodeMove.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchAvailableTargetGroupsForEpisodeMove_ts["fetchAvailableTargetGroupsForEpisodeMove.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_fetchAvailableTargetGroupsForEpisodeMove_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_fetchAvailableTargetGroupsForEpisodeMove_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_fetchAvailableTargetGroupsForEpisodeMove_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: fetchEpisodeDetail.ts

Shows files that use the `fetchEpisodeDetail.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchEpisodeDetail_ts["fetchEpisodeDetail.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_dialogue_ts["dialogue.ts"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                    src_lib_domain_entities_sentenceCard_ts["sentenceCard.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                    src_lib_infrastructure_repositories_sentenceCardRepository_ts["sentenceCardRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
        end
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_dialogue_ts
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_episode_ts
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_domain_entities_sentenceCard_ts
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_application_usecases_fetchEpisodeDetail_ts --> src_lib_infrastructure_repositories_sentenceCardRepository_ts
    src_lib_infrastructure_repositories_dialogueRepository_ts --> src_lib_domain_entities_dialogue_ts
    src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
    src_lib_infrastructure_repositories_sentenceCardRepository_ts --> src_lib_domain_entities_sentenceCard_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_fetchEpisodeDetail_ts
```
### Use Case: fetchEpisodeGroups.ts

Shows files that use the `fetchEpisodeGroups.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchEpisodeGroups_ts["fetchEpisodeGroups.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_ts["+page.ts"]
            end
        end
    src_lib_application_usecases_fetchEpisodeGroups_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_fetchEpisodeGroups_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_ts --> src_lib_application_usecases_fetchEpisodeGroups_ts
```
### Use Case: fetchEpisodes.ts

Shows files that use the `fetchEpisodes.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchEpisodes_ts["fetchEpisodes.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_ts["+page.ts"]
                end
            end
        end
    src_lib_application_usecases_fetchEpisodes_ts --> src_lib_domain_entities_episode_ts
    src_lib_application_usecases_fetchEpisodes_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_fetchEpisodes_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_application_usecases_fetchEpisodes_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
    src_routes_episode_list__groupId___page_ts --> src_lib_application_usecases_fetchEpisodes_ts
    src_routes_episode_list__groupId___page_ts --> src_lib_domain_entities_episode_ts
```
### Use Case: fetchSettings.ts

Shows files that use the `fetchSettings.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_apiKeyStore_svelte_ts["apiKeyStore.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchSettings_ts["fetchSettings.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_settings_ts["settings.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_apiKeyRepository_ts["apiKeyRepository.ts"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
            subgraph sg_routes_settings ["settings"]
                src_routes_settings__page_ts["+page.ts"]
            end
        end
    src_lib_application_usecases_fetchSettings_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
    src_lib_application_usecases_fetchSettings_ts --> src_lib_domain_entities_settings_ts
    src_lib_application_usecases_fetchSettings_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
    src_lib_application_usecases_fetchSettings_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
    src_lib_infrastructure_repositories_settingsRepository_ts --> src_lib_domain_entities_settings_ts
    src_routes_settings__page_ts --> src_lib_application_usecases_fetchSettings_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_fetchSettings_ts
```
### Use Case: fetchTtsVoices.ts

Shows files that use the `fetchTtsVoices.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchTtsVoices_ts["fetchTtsVoices.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_voice_ts["voice.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                    src_lib_infrastructure_repositories_ttsRepository_ts["ttsRepository.ts"]
                end
            end
            subgraph sg_lib_utils ["utils"]
                src_lib_utils_language_ts["language.ts"]
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte["TtsEpisodeAddContainer.svelte"]
                    end
                end
            end
        end
    src_lib_application_usecases_fetchTtsVoices_ts --> src_lib_domain_entities_voice_ts
    src_lib_application_usecases_fetchTtsVoices_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
    src_lib_application_usecases_fetchTtsVoices_ts --> src_lib_infrastructure_repositories_ttsRepository_ts
    src_lib_application_usecases_fetchTtsVoices_ts --> src_lib_utils_language_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_domain_entities_voice_ts
    src_lib_infrastructure_repositories_ttsRepository_ts --> src_lib_utils_language_ts
    src_routes_episode_list__groupId__container_TtsEpisodeAddContainer_svelte --> src_lib_application_usecases_fetchTtsVoices_ts
```
### Use Case: fetchYoutubeMetadata.ts

Shows files that use the `fetchYoutubeMetadata.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_apiKeyStore_svelte_ts["apiKeyStore.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_fetchYoutubeMetadata_ts["fetchYoutubeMetadata.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_youtubeMetadata_ts["youtubeMetadata.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_youtubeUrlValidator_ts["youtubeUrlValidator.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_apiKeyRepository_ts["apiKeyRepository.ts"]
                    src_lib_infrastructure_repositories_youtubeRepository_ts["youtubeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte["YoutubeEpisodeAddContainer.svelte"]
                    end
                end
            end
        end
    src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_application_stores_apiKeyStore_svelte_ts
    src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_domain_entities_youtubeMetadata_ts
    src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_domain_services_youtubeUrlValidator_ts
    src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
    src_lib_application_usecases_fetchYoutubeMetadata_ts --> src_lib_infrastructure_repositories_youtubeRepository_ts
    src_lib_infrastructure_repositories_youtubeRepository_ts --> src_lib_domain_entities_youtubeMetadata_ts
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_lib_application_usecases_fetchYoutubeMetadata_ts
    src_routes_episode_list__groupId__container_YoutubeEpisodeAddContainer_svelte --> src_lib_domain_entities_youtubeMetadata_ts
```
### Use Case: initializeApplication.ts

Shows files that use the `initializeApplication.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_i18n_svelte_ts["i18n.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_initializeApplication_ts["initializeApplication.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            src_routes__layout_ts["+layout.ts"]
        end
    src_lib_application_usecases_initializeApplication_ts --> src_lib_application_stores_i18n_svelte_ts
    src_lib_application_usecases_initializeApplication_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
    src_routes__layout_ts --> src_lib_application_usecases_initializeApplication_ts
```
### Use Case: audioPlayer.ts

Shows files that use the `audioPlayer.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_audioInfoCacheStore_svelte_ts["audioInfoCacheStore.svelte.ts"]
                    src_lib_application_stores_mediaPlayerStore_svelte_ts["mediaPlayerStore.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    subgraph sg_lib_application_usecases_mediaPlayer ["mediaPlayer"]
                        src_lib_application_usecases_mediaPlayer_audioPlayer_ts["audioPlayer.ts"]
                        src_lib_application_usecases_mediaPlayer_mediaPlayer_ts["mediaPlayer.ts"]
                    end
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_audioInfo_ts["audioInfo.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_audioRepository_ts["audioRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
        end
    src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_stores_audioInfoCacheStore_svelte_ts
    src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_stores_mediaPlayerStore_svelte_ts
    src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
    src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_domain_entities_audioInfo_ts
    src_lib_application_usecases_mediaPlayer_audioPlayer_ts --> src_lib_infrastructure_repositories_audioRepository_ts
    src_lib_application_stores_audioInfoCacheStore_svelte_ts --> src_lib_domain_entities_audioInfo_ts
    src_lib_infrastructure_repositories_audioRepository_ts --> src_lib_domain_entities_audioInfo_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_audioPlayer_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
    src_routes_episode__id___page_ts --> src_lib_domain_entities_audioInfo_ts
```
### Use Case: mediaPlayer.ts

Shows files that use the `mediaPlayer.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    subgraph sg_lib_application_usecases_mediaPlayer ["mediaPlayer"]
                        src_lib_application_usecases_mediaPlayer_mediaPlayer_ts["mediaPlayer.ts"]
                    end
                end
            end
            subgraph sg_lib_presentation ["presentation"]
                subgraph sg_lib_presentation_actions ["actions"]
                    src_lib_presentation_actions_keyboardShortcuts_ts["keyboardShortcuts.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
        end
    src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
    src_lib_presentation_actions_keyboardShortcuts_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
```
### Use Case: youtubePlayer.ts

Shows files that use the `youtubePlayer.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_mediaPlayerStore_svelte_ts["mediaPlayerStore.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    subgraph sg_lib_application_usecases_mediaPlayer ["mediaPlayer"]
                        src_lib_application_usecases_mediaPlayer_mediaPlayer_ts["mediaPlayer.ts"]
                        src_lib_application_usecases_mediaPlayer_youtubePlayer_ts["youtubePlayer.ts"]
                    end
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_youtubeUrlValidator_ts["youtubeUrlValidator.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                    src_routes_episode__id___page_ts["+page.ts"]
                end
            end
        end
    src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_application_stores_mediaPlayerStore_svelte_ts
    src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
    src_lib_application_usecases_mediaPlayer_youtubePlayer_ts --> src_lib_domain_services_youtubeUrlValidator_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_mediaPlayer_ts
    src_routes_episode__id___page_ts --> src_lib_application_usecases_mediaPlayer_youtubePlayer_ts
    src_routes_episode__id___page_svelte --> src_lib_application_stores_mediaPlayerStore_svelte_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_mediaPlayer_youtubePlayer_ts
```
### Use Case: moveEpisode.ts

Shows files that use the `moveEpisode.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_moveEpisode_ts["moveEpisode.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_moveEpisode_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_moveEpisode_ts
```
### Use Case: moveEpisodeGroup.ts

Shows files that use the `moveEpisodeGroup.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_moveEpisodeGroup_ts["moveEpisodeGroup.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_groupTreeHelper_ts["groupTreeHelper.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_domain_services_groupTreeHelper_ts
    src_lib_application_usecases_moveEpisodeGroup_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_domain_services_groupTreeHelper_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_moveEpisodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: previewScriptFile.ts

Shows files that use the `previewScriptFile.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_previewScriptFile_ts["previewScriptFile.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_scriptPreview_ts["scriptPreview.ts"]
                end
                subgraph sg_lib_domain_services ["services"]
                    src_lib_domain_services_parseScriptPreview_ts["parseScriptPreview.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_fileRepository_ts["fileRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    subgraph sg_routes_episode_list__groupId__container ["container"]
                        src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts["tsvConfigController.svelte.ts"]
                    end
                end
            end
        end
    src_lib_application_usecases_previewScriptFile_ts --> src_lib_domain_entities_scriptPreview_ts
    src_lib_application_usecases_previewScriptFile_ts --> src_lib_domain_services_parseScriptPreview_ts
    src_lib_application_usecases_previewScriptFile_ts --> src_lib_infrastructure_repositories_fileRepository_ts
    src_lib_domain_services_parseScriptPreview_ts --> src_lib_domain_entities_scriptPreview_ts
    src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts --> src_lib_application_usecases_previewScriptFile_ts
    src_routes_episode_list__groupId__container_tsvConfigController_svelte_ts --> src_lib_domain_entities_scriptPreview_ts
```
### Use Case: saveSettings.ts

Shows files that use the `saveSettings.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_stores ["stores"]
                    src_lib_application_stores_i18n_svelte_ts["i18n.svelte.ts"]
                end
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_saveSettings_ts["saveSettings.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_settings_ts["settings.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_apiKeyRepository_ts["apiKeyRepository.ts"]
                    src_lib_infrastructure_repositories_settingsRepository_ts["settingsRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_settings ["settings"]
                src_routes_settings__page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_saveSettings_ts --> src_lib_application_stores_i18n_svelte_ts
    src_lib_application_usecases_saveSettings_ts --> src_lib_domain_entities_settings_ts
    src_lib_application_usecases_saveSettings_ts --> src_lib_infrastructure_repositories_apiKeyRepository_ts
    src_lib_application_usecases_saveSettings_ts --> src_lib_infrastructure_repositories_settingsRepository_ts
    src_lib_infrastructure_repositories_settingsRepository_ts --> src_lib_domain_entities_settings_ts
    src_routes_settings__page_svelte --> src_lib_application_stores_i18n_svelte_ts
    src_routes_settings__page_svelte --> src_lib_application_usecases_saveSettings_ts
    src_routes_settings__page_svelte --> src_lib_domain_entities_settings_ts
```
### Use Case: softDeleteDialogue.ts

Shows files that use the `softDeleteDialogue.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_softDeleteDialogue_ts["softDeleteDialogue.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_softDeleteDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_softDeleteDialogue_ts
```
### Use Case: undoSoftDeleteDialogue.ts

Shows files that use the `undoSoftDeleteDialogue.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_undoSoftDeleteDialogue_ts["undoSoftDeleteDialogue.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_undoSoftDeleteDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_undoSoftDeleteDialogue_ts
```
### Use Case: updateDialogue.ts

Shows files that use the `updateDialogue.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_updateDialogue_ts["updateDialogue.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_dialogueRepository_ts["dialogueRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode ["episode"]
                subgraph sg_routes_episode__id_ ["[id]"]
                    src_routes_episode__id___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_updateDialogue_ts --> src_lib_infrastructure_repositories_dialogueRepository_ts
    src_routes_episode__id___page_svelte --> src_lib_application_usecases_updateDialogue_ts
```
### Use Case: updateEpisodeGroupName.ts

Shows files that use the `updateEpisodeGroupName.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_updateEpisodeGroupName_ts["updateEpisodeGroupName.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_updateEpisodeGroupName_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_updateEpisodeGroupName_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_updateEpisodeGroupName_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: updateEpisodeGroupsOrder.ts

Shows files that use the `updateEpisodeGroupsOrder.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_updateEpisodeGroupsOrder_ts["updateEpisodeGroupsOrder.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episodeGroup_ts["episodeGroup.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeGroupRepository_ts["episodeGroupRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_____groupId_ ["[...groupId]"]
                src_routes_____groupId___page_svelte["+page.svelte"]
            end
        end
    src_lib_application_usecases_updateEpisodeGroupsOrder_ts --> src_lib_domain_entities_episodeGroup_ts
    src_lib_application_usecases_updateEpisodeGroupsOrder_ts --> src_lib_infrastructure_repositories_episodeGroupRepository_ts
    src_lib_infrastructure_repositories_episodeGroupRepository_ts --> src_lib_domain_entities_episodeGroup_ts
    src_routes_____groupId___page_svelte --> src_lib_application_usecases_updateEpisodeGroupsOrder_ts
    src_routes_____groupId___page_svelte --> src_lib_domain_entities_episodeGroup_ts
```
### Use Case: updateEpisodeName.ts

Shows files that use the `updateEpisodeName.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_updateEpisodeName_ts["updateEpisodeName.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_updateEpisodeName_ts --> src_lib_domain_entities_episode_ts
    src_lib_application_usecases_updateEpisodeName_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_updateEpisodeName_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_episode_ts
```
### Use Case: updateEpisodesOrder.ts

Shows files that use the `updateEpisodesOrder.ts` use case, and the files it depends on.

```mermaid
graph LR
        subgraph sg_lib ["lib"]
            subgraph sg_lib_application ["application"]
                subgraph sg_lib_application_usecases ["usecases"]
                    src_lib_application_usecases_updateEpisodesOrder_ts["updateEpisodesOrder.ts"]
                end
            end
            subgraph sg_lib_domain ["domain"]
                subgraph sg_lib_domain_entities ["entities"]
                    src_lib_domain_entities_episode_ts["episode.ts"]
                end
            end
            subgraph sg_lib_infrastructure ["infrastructure"]
                subgraph sg_lib_infrastructure_repositories ["repositories"]
                    src_lib_infrastructure_repositories_episodeRepository_ts["episodeRepository.ts"]
                end
            end
        end
        subgraph sg_routes ["routes"]
            subgraph sg_routes_episode_list ["episode-list"]
                subgraph sg_routes_episode_list__groupId_ ["[groupId]"]
                    src_routes_episode_list__groupId___page_svelte["+page.svelte"]
                end
            end
        end
    src_lib_application_usecases_updateEpisodesOrder_ts --> src_lib_domain_entities_episode_ts
    src_lib_application_usecases_updateEpisodesOrder_ts --> src_lib_infrastructure_repositories_episodeRepository_ts
    src_lib_infrastructure_repositories_episodeRepository_ts --> src_lib_domain_entities_episode_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_application_usecases_updateEpisodesOrder_ts
    src_routes_episode_list__groupId___page_svelte --> src_lib_domain_entities_episode_ts
```

# Src Folder-level Dependency Graph

Dependency graph showing relationships between directories under `src/`.

```mermaid
graph LR
        subgraph sg_src ["src"]
            src_routes["routes"]
            subgraph sg_src_lib ["lib"]
                subgraph sg_src_lib_application ["application"]
                    src_lib_application_locales["locales"]
                    src_lib_application_stores["stores"]
                    src_lib_application_usecases["usecases"]
                end
                subgraph sg_src_lib_domain ["domain"]
                    src_lib_domain_entities["entities"]
                    src_lib_domain_services["services"]
                end
                subgraph sg_src_lib_infrastructure ["infrastructure"]
                    src_lib_infrastructure_repositories["repositories"]
                end
                subgraph sg_src_lib_presentation ["presentation"]
                    src_lib_presentation_actions["actions"]
                    src_lib_presentation_components["components"]
                    src_lib_presentation_utils["utils"]
                end
            end
        end
    src_lib_application_stores --> src_lib_application_locales
    src_lib_application_stores --> src_lib_application_usecases
    src_lib_application_stores --> src_lib_domain_entities
    src_lib_application_usecases --> src_lib_application_stores
    src_lib_application_usecases --> src_lib_domain_entities
    src_lib_application_usecases --> src_lib_domain_services
    src_lib_application_usecases --> src_lib_infrastructure_repositories
    src_lib_domain_services --> src_lib_domain_entities
    src_lib_infrastructure_repositories --> src_lib_domain_entities
    src_lib_presentation_actions --> src_lib_application_usecases
    src_lib_presentation_actions --> src_lib_domain_entities
    src_lib_presentation_components --> src_lib_application_stores
    src_lib_presentation_components --> src_lib_domain_entities
    src_routes --> src_lib_application_stores
    src_routes --> src_lib_application_usecases
    src_routes --> src_lib_domain_entities
    src_routes --> src_lib_presentation_actions
    src_routes --> src_lib_presentation_components
    src_routes --> src_lib_presentation_utils
```
