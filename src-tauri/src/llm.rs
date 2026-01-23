use gemini_rust::client::Error as GeminiError;
use gemini_rust::{Gemini, Model, ThinkingConfig, ThinkingLevel};
use log::{debug, error, warn};
use schemars::generate::SchemaSettings;
use schemars::{JsonSchema, SchemaGenerator};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, JsonSchema)]
#[schemars(
    description = "Represents an item of vocabulary or expression identified in the target line."
)]
pub struct SentenceMiningItem {
    #[schemars(
        description = "A complete, grammatically correct sentence. If the target line was a fragment, this sentence is reconstructed by combining it with adjacent lines, strictly preserving their original sequence. If the target line was already complete, this will be the target line itself."
    )]
    pub expression: String,

    #[schemars(
        description = "The part of speech or type of the expression, written in the learner's native language. The value should be a common linguistic term that best describes the extracted expression."
    )]
    #[serde(rename = "partOfSpeech")]
    pub part_of_speech: String,

    #[schemars(
        description = "A concise, direct definition of the expression in the learner's native language, explaining its meaning *specifically as used in the target line*. Avoid overtly explanatory or redundant phrasing."
    )]
    #[serde(rename = "contextualDefinition")]
    pub contextual_definition: String,

    #[schemars(
        description = "A detailed, core meaning explanation of the expression in the learner's native language, independent of the specific context."
    )]
    #[serde(rename = "coreMeaning")]
    pub core_meaning: String,

    #[schemars(
        description = "The full sentence from the top-level result, with this item's specific 'expression' highlighted using <b> tags."
    )]
    #[serde(rename = "exampleSentence")]
    pub example_sentence: String,
}

#[derive(Deserialize, Serialize, JsonSchema)]
#[schemars(description = "The result of a sentence mining analysis.")]
pub struct SentenceMiningResult {
    #[schemars(
        description = "A complete, grammatically correct sentence constructed from the target line and its context."
    )]
    pub sentence: String,

    #[schemars(
        description = "A translation of the top-level 'sentence' field into the learner's native language."
    )]
    pub translation: String,

    #[schemars(
        description = "An explanation in the learner's native language detailing the grammatical structure and vocabulary of the top-level 'sentence' field, clarifying the reasoning behind its translation."
    )]
    pub explanation: String,

    #[schemars(
        description = "A list of identified vocabulary and expressions from the target line."
    )]
    pub items: Vec<SentenceMiningItem>,
}

fn build_prompt(
    learning_language: &str,
    explanation_language: &str,
    context: &str,
    target_sentence: &str,
) -> String {
    // cSpell:words CEFR
    format!(
        r#"
# Role

You are an expert linguistic assistant for language learners. Your **main task** is to analyze a line within its context, identify important vocabulary and expressions that a learner might not know, and provide clear, concise explanations in their native language.

# Task

Analyze the `TARGET_LINE` below. It is part of a larger conversation provided in the `CONVERSATION_LOG`. Your analysis will result in several key components: a complete contextual sentence, its translation and explanation, and a list of identified vocabulary items.

### Main Output Fields

Your analysis should result in the following top-level fields:

* `sentence`: A complete, grammatically correct sentence constructed from the `TARGET_LINE` and its context.
* `translation`: A translation of the `sentence`.
* `explanation`: An explanation of the `sentence`.
* `items`: A list of identified vocabulary items from the `TARGET_LINE`.

### Vocabulary Item Breakdown (`items`)

For each item identified from the `TARGET_LINE`, you must provide:
a.  `expression`: The extracted word or phrase. Use the base form (lemma) for verbs.
b.  `partOfSpeech`: The part of speech or category of the expression, **written in the `EXPLANATION_LANGUAGE`**. The value should be a common linguistic term (e.g., "Noun", "Verb", "Idiom," etc. in the appropriate translation) that best describes the extracted expression.
c.  `contextualDefinition`: A concise, contextual definition in the `EXPLANATION_LANGUAGE`. This definition should be a brief explanation of the **meaning of the extracted expression itself**, **without** any overtly explanatory or redundant phrasing.
d.  `coreMeaning`: A detailed, core meaning explanation in the `EXPLANATION_LANGUAGE`. This explanation must describe the fundamental, general meaning of the word or phrase, independent of the specific sentence context.
e.  `exampleSentence`: The full `sentence` from the top-level, but with the specific `expression` for this item highlighted using `<b>` tags.

### Translation and Explanation Tasks

1.  **Translate the complete `sentence` into the `EXPLANATION_LANGUAGE`.**
2.  Provide a clear explanation in the `EXPLANATION_LANGUAGE` for why the **`sentence`** is translated as such. This explanation should break down its grammatical structure, explain the role of key phrases (especially those from the original `TARGET_LINE`), and show how the identified vocabulary contributes to the overall meaning.

# Rules

* **Principle of Direct Definition**: This is the most important rule. The `contextualDefinition` and `coreMeaning` fields **must always be a direct definition of the exact text extracted in the `expression` field**.
* **Filtering**: Do NOT extract extremely basic, common words (e.g., CEFR A1 level). Focus on words and phrases an intermediate learner would find challenging.
* **Comprehensive Identification**: You must identify both multi-word units (phrasal verbs, idioms, etc.) and important individual words from the `TARGET_LINE`. When you identify a phrase, also consider extracting its key component words separately if they are likely to be unknown to an intermediate learner.
* **Part-of-Speech Language**: The value for the `partOfSpeech` field **MUST be written in the `EXPLANATION_LANGUAGE`** (the learner's native language). Use a common linguistic term that an average language learner would understand (e.g., 名詞, 動詞, 慣用句).
* **Empty Result**: If no relevant expressions are found, the "items" array should be empty, but the `sentence`, `translation`, and `explanation` fields should still be provided.
* **[CRITICAL] Rule for `sentence` and `exampleSentence` Construction**: Your construction process must follow two steps, with a strict ordering constraint:
  1. **Generate the Base `sentence`**:
      * First, determine if the `TARGET_LINE` is a grammatically complete sentence on its own.
      * If it is complete, use the `TARGET_LINE` *exactly as-is* for the `sentence`.
      * If the `TARGET_LINE` is a fragment (e.g., from an ASR transcript), you must reconstruct the full, continuous sentence it belongs to. To do this, find the necessary lines immediately preceding and/or succeeding the `TARGET_LINE` in the `CONVERSATION_LOG` that form this single utterance.
      * **Sequential Constraint**: You **MUST** combine these lines (e.g., `preceding_line` + `TARGET_LINE` + `succeeding_line`) **strictly in their original sequence** as they appear in the `CONVERSATION_LOG`. **Do NOT reorder, rearrange, or shuffle the lines.** The goal is to "stitch together" the fragments into the single, continuous utterance they represent, preserving their original order.
      * **This complete, sequentially-ordered sentence is the value for the top-level `sentence` field.**
  2. **Generate each `exampleSentence`**: For each vocabulary item in the `items` array, take the base `sentence` generated in Step 1 and enclose the corresponding `expression` for that item within `<b>` tags. This highlighted version is the value for the `exampleSentence` field within that item.
* **Language Fidelity**: All user-facing explanations (`translation`, `explanation`, `contextualDefinition`, `coreMeaning`, and `partOfSpeech`) **MUST** be written in the specified `EXPLANATION_LANGUAGE`.
* **Negation Handling**: When extracting a verb from a negative construction (e.g., "didn't finish"), extract the base form (`finish`). The explanations for the verb should define the verb itself, not the negation. The role of the negation should be covered in the main `explanation` field.

# Example

Here is an example of how to apply the rules.

## Scenario

- A user is learning **English** and wants explanations in **Japanese**. (`EXPLANATION_LANGUAGE` is `Japanese`)
- The `CONVERSATION_LOG` is:
  > Did you finish the report for the meeting
  > Not yet
  > I had to pull an all-nighter to get it done
  > but it's almost there
  > Make sure it's ready by noon
- The `TARGET_LINE` is:
  > I had to pull an all-nighter to get it done

## Expected Output

**sentence**:
I had to pull an all-nighter to get it done, but it's almost there.

**translation**:
それを終わらせるために徹夜しなければなりませんでしたが、もうほとんど出来ています。

**explanation**
この文は、2つの節が接続詞 'but' で繋がれた構造をしています。前半の 'I had to pull an all-nighter to get it done' は、「～するために徹夜しなければならなかった」という意味です。'had to' は義務を表し、'to get it done' は目的を表す不定詞句です。'pull an all-nighter' が「徹夜する」という重要な慣用句です。後半の 'it's almost there' は「もうすぐだ」「ゴールは近い」という意味の口語表現で、ここではレポートの完成が間近であることを示しています。これらを組み合わせることで、全体の意味が形成されます。

**items**:

- **Item 1**:
  - **expression**: pull an all-nighter
  - **partOfSpeech**: 慣用句
  - **contextualDefinition**: 徹夜する
  - **coreMeaning**: 一晩中、特に勉強や仕事のために起きていること。睡眠をとらずに夜を明かすという行為そのものを指す表現。
  - **exampleSentence**: I had to <b>pull an all-nighter</b> to get it done, but it's almost there.
- **Item 2**:
  - **expression**: get something done
  - **partOfSpeech**: 表現
  - **contextualDefinition**: ～を終わらせる、完成させる
  - **coreMeaning**: あるタスクや仕事を完了させる、または誰かに完了させることを示す使役的な表現。ここでは自分自身で終わらせることを指す。
  - **exampleSentence**: I had to pull an all-nighter to <b>get it done</b>, but it's almost there.
- **Item 3**:
  - **expression**: almost there
  - **partOfSpeech**: 表現
  - **contextualDefinition**: もうほとんど出来ている、完成間近である
  - **coreMeaning**: 物理的な目的地や、目標達成まであと少しのところまで来ている状態を指す口語的な表現。
  - **exampleSentence**: I had to pull an all-nighter to get it done, but it's <b>almost there</b>.

# Input

* **LEARNING_LANGUAGE**:  {learning_language}
* **EXPLANATION_LANGUAGE**: {explanation_language}
* **CONVERSATION_LOG**:
```
{context}
```
* **TARGET_LINE**:
```
{target_sentence}
```
        "#
    )
}

fn build_response_schema() -> serde_json::Value {
    let schema_generator = SchemaGenerator::new(SchemaSettings::openapi3().with(|settings| {
        settings.inline_subschemas = true;
        settings.meta_schema = None;
    }));
    let mut schema = schema_generator.into_root_schema_for::<SentenceMiningResult>();
    schema.remove("title");
    schema.to_value()
}

#[tauri::command]
pub async fn analyze_sentence_with_llm(
    api_key: String,
    learning_language: String,
    explanation_language: String,
    context: String,
    target_sentence: String,
) -> Result<SentenceMiningResult, String> {
    let prompt = build_prompt(
        &learning_language,
        &explanation_language,
        &context,
        &target_sentence,
    );
    debug!("Generated prompt: {}", prompt);

    let schema = build_response_schema();
    let response_text = generate_with_fallback(&api_key, &prompt, &schema)
        .await
        .map_err(|err| {
            error!("Failed to generate content: {}", err);
            "Failed to generate content".to_string()
        })?;
    let result = serde_json::from_str(&response_text).map_err(|err| {
        error!("Failed to parse response: {}", err);
        "Failed to parse response".to_string()
    })?;
    Ok(result)
}

async fn generate_with_model(
    api_key: &str,
    model: Model,
    prompt: &str,
    schema: &serde_json::Value,
) -> Result<String, GeminiError> {
    let client = Gemini::with_model(api_key, model)?;
    let thinking_config = ThinkingConfig::new().with_thinking_level(ThinkingLevel::Low);
    let response = client
        .generate_content()
        .with_system_prompt("Return only JSON that matches the response schema.")
        .with_user_message(prompt)
        .with_thinking_config(thinking_config)
        .with_response_mime_type("application/json")
        .with_response_schema(schema.clone())
        .execute()
        .await?;
    Ok(response.text())
}

async fn generate_with_fallback(
    api_key: &str,
    prompt: &str,
    schema: &serde_json::Value,
) -> Result<String, GeminiError> {
    let mut last_error = None;
    let models = vec![
        Model::Gemini3Flash,
        Model::Gemini25Flash,
        Model::Gemini25Pro,
    ];
    for (index, model) in models.iter().enumerate() {
        match generate_with_model(api_key, model.clone(), prompt, schema).await {
            Ok(result) => return Ok(result),
            Err(err) if is_rate_limit_error(&err) => {
                last_error = Some(err);
                if let Some(next_model) = models.get(index + 1) {
                    warn!(
                        "Rate limit reached on model {}, falling back to {}: {}",
                        model,
                        next_model,
                        last_error.as_ref().unwrap()
                    );
                } else {
                    break;
                }
            }
            Err(err) => return Err(err),
        }
    }

    Err(last_error.unwrap_or_else(|| GeminiError::OperationFailed {
        name: "generate_with_fallback".to_string(),
        code: 0,
        message: "No models available".to_string(),
    }))
}

fn is_rate_limit_error(err: &GeminiError) -> bool {
    matches!(err, GeminiError::BadResponse { code, .. } if *code == 429)
}
