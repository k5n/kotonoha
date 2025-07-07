use google_ai_rs::{AsSchema, Client, TypedModel};
use log;
use serde::{Deserialize, Serialize};

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(
    rename_all = "camelCase",
    description = "Represents an item of vocabulary or expression identified in a sentence."
)]
pub struct SentenceMiningItem {
    #[schema(description = "The expression or phrase identified in the target sentence.")]
    pub expression: String,

    #[schema(
        description = "The part of speech or type of the expression (e.g., 'Phrasal verb', 'Idiom', 'Noun')."
    )]
    #[serde(rename = "partOfSpeech")]
    pub part_of_speech: String,

    #[schema(
        description = "A simple definition of the expression in the learner's native language, explaining its meaning as used in the target sentence."
    )]
    pub definition: String,

    #[schema(
        description = "The original target sentence with the identified expression highlighted using <b> tags."
    )]
    #[serde(rename = "exampleSentence")]
    pub example_sentence: String,
}

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(
    rename_all = "camelCase",
    description = "Result of sentence mining analysis."
)]
pub struct SentenceMiningResult {
    #[schema(
        description = "A list of identified vocabulary and expressions from the target sentence."
    )]
    pub items: Vec<SentenceMiningItem>,
}

fn build_prompt(
    learning_language: &str,
    explanation_language: &str,
    part_of_speech_options: &str,
    context: &str,
    target_sentence: &str,
) -> String {
    // cSpell:words CEFR
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
- **PART_OF_SPEECH_OPTIONS**: [{part_of_speech_options}]
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
pub async fn analyze_sentence_with_llm(
    api_key: String,
    learning_language: String,
    explanation_language: String,
    part_of_speech_options: Vec<String>,
    context: String,
    target_sentence: String,
) -> Result<SentenceMiningResult, String> {
    let part_of_speech_options = part_of_speech_options
        .into_iter()
        .map(|s| format!("\"{}\"", s.trim()))
        .collect::<Vec<_>>()
        .join(", ");
    let prompt = build_prompt(
        &learning_language,
        &explanation_language,
        &part_of_speech_options,
        &context,
        &target_sentence,
    );
    log::debug!("Generated prompt: {}", prompt);

    let client = Client::new(api_key.into()).await.map_err(|e| {
        log::error!("Failed to create Google AI client: {}", e);
        "Failed to create Google AI client".to_string()
    })?;
    let model = TypedModel::<SentenceMiningResult>::new(&client, "gemini-2.5-flash");
    let result = model.generate_content(prompt).await.map_err(|e| {
        log::error!("Failed to generate content: {}", e);
        "Failed to generate content".to_string()
    })?;

    Ok(result)
}
