// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// cSpell:words HWID
mod migrations;

use dotenvy::from_filename;
use google_ai_rs::{AsSchema, Client, TypedModel};
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use migrations::get_migrations;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(rename_all = "camelCase")]
struct SentenceMiningItem {
    expression: String,
    part_of_speech: String,
    definition: String,
    example_sentence: String,
}

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(rename_all = "camelCase")]
struct SentenceMiningResult {
    items: Vec<SentenceMiningItem>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzeSentenceWithLlmResponse {
    result: SentenceMiningResult,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn build_prompt(
    learning_language: &str,
    explanation_language: &str,
    context: &str,
    target_sentence: &str,
) -> String {
    format!(
        r#"
# Role
You are an expert linguistic assistant for language learners. Your task is to analyze a sentence within its context, identify important vocabulary and expressions that a learner might not know, and provide clear, concise explanations in their native language.

# Task
Analyze the `TARGET_SENTENCE` below. It is part of a larger conversation provided in the `CONTEXT`.
Identify all non-basic vocabulary, phrasal verbs, idioms, and other common expressions from the `TARGET_SENTENCE`.

For each identified item, you must:
1.  Extract the expression. If it's a verb, provide its base form (lemma). For example, if you see "took off", extract "take off".
2.  Provide its part of speech (e.g., "phrasal verb", "idiom", "noun").
3.  Write a simple definition in the specified `EXPLANATION_LANGUAGE`. The definition must explain the meaning of the expression **as it is used in the `TARGET_SENTENCE`**.
4.  Provide the original `TARGET_SENTENCE` with the expression highlighted using `<b>` tags.

# Rules
- **Filtering**: Do NOT extract extremely basic, common words (e.g., CEFR A1 level words like 'the', 'a', 'is', 'go', 'I', 'you'). Focus on words and phrases an intermediate learner would find challenging.
- **Phrases over Words**: Prioritize identifying multi-word units. For example, in "He is going to look up the word", you must identify "look up" as a single phrasal verb, not "look" and "up" as separate words.
- **Strict JSON Output**: The final output MUST be a single valid JSON object. Do not include any other text, explanations, or markdown formatting like `json` blocks outside of the JSON object itself.
- **Empty Result**: If no relevant expressions are found in the `TARGET_SENTENCE`, return a JSON object with an empty "items" array.
- **Character Encoding**: Ensure all content within the JSON is properly escaped.

# Input
- **LEARNING_LANGUAGE**:  {learning_language}
- **EXPLANATION_LANGUAGE**: {explanation_language}
- **CONTEXT**:
```
{context}
```
- **TARGET_SENTENCE**:
```
{target_sentence}
```
        "#
    )
}

#[tauri::command]
async fn analyze_sentence_with_llm(
    api_key: String,
    learning_language: String,
    explanation_language: String,
    context: String,
    target_sentence: String,
) -> AnalyzeSentenceWithLlmResponse {
    let prompt = build_prompt(
        &learning_language,
        &explanation_language,
        &context,
        &target_sentence,
    );

    let client = Client::new(api_key.into())
        .await
        .expect("Failed to create Google AI client"); // FIXME: エラーハンドリングを追加
    let model = TypedModel::<SentenceMiningResult>::new(&client, "gemini-2.5-flash");
    let result = model
        .generate_content(prompt)
        .await
        .expect("Failed to generate content"); // FIXME: エラーハンドリングを追加

    AnalyzeSentenceWithLlmResponse {
        result: result.into(),
        error: None,
    }
}

fn get_db_name() -> String {
    let env_file = if cfg!(debug_assertions) {
        ".env.development"
    } else {
        ".env.production"
    };
    let _ = from_filename(env_file);
    env::var("PUBLIC_APP_DB_NAME").unwrap_or_else(|_| "app.db".to_string())
}

/// Generates a hardware ID (HWID) for the system.
fn get_hwid() -> String {
    const HWID_KEY: &str = "3f8b0c3b519340974b0fa3aad09939402d969f52f1d84a4abac56f17e32623ba";
    IdBuilder::new(Encryption::SHA256)
        .add_component(HWIDComponent::SystemID)
        .add_component(HWIDComponent::OSName)
        .add_component(HWIDComponent::MachineName)
        .add_component(HWIDComponent::Username)
        .build(HWID_KEY)
        .unwrap_or_else(|_| HWID_KEY.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_name = get_db_name();
    let db_url = format!("sqlite:{}", db_name);
    println!("Using database URL: {}", db_url);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_stronghold::Builder::new(|_| {
                // HWID is also hash, but it is only used to generate a unique identifier for the machine.
                // Argon2 is a memory-hard function that is designed to be slow and resistant to brute-force attacks.
                use argon2::{hash_raw, Config, Variant, Version};

                let config = Config {
                    lanes: 4,
                    mem_cost: 10_000,
                    time_cost: 10,
                    variant: Variant::Argon2id,
                    version: Version::Version13,
                    ..Default::default()
                };
                let salt = "kotonoha".as_bytes();
                let password = get_hwid();
                let key =
                    hash_raw(password.as_ref(), salt, &config).expect("failed to hash password");

                key.to_vec()
            })
            .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![analyze_sentence_with_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
