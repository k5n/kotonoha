use google_ai_rs::{AsSchema, Client, TypedModel};
use log;
use serde::{Deserialize, Serialize};

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(
    rename_all = "camelCase",
    description = "Represents an item of vocabulary or expression identified in the target line."
)]
pub struct SentenceMiningItem {
    #[schema(description = "The expression or phrase identified in the target line.")]
    pub expression: String,

    #[schema(
        description = "The part of speech or type of the expression, chosen from the predefined PART_OF_SPEECH_OPTIONS list provided in the input."
    )]
    #[serde(rename = "partOfSpeech")]
    pub part_of_speech: String,

    #[schema(
        description = "A concise, direct definition of the expression in the learner's native language, explaining its meaning *specifically as used in the target line*. Avoid overtly explanatory or redundant phrasing."
    )]
    #[serde(rename = "contextualDefinition")]
    pub contextual_definition: String,

    #[schema(
        description = "A detailed, core meaning explanation of the expression in the learner's native language, independent of the specific context."
    )]
    #[serde(rename = "coreMeaning")]
    pub core_meaning: String,

    #[schema(
        description = "The full sentence from the top-level result, with this item's specific 'expression' highlighted using <b> tags."
    )]
    #[serde(rename = "exampleSentence")]
    pub example_sentence: String,
}

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(description = "The result of a sentence mining analysis.")]
pub struct SentenceMiningResult {
    #[schema(
        description = "A complete, grammatically correct sentence constructed from the target line and its context."
    )]
    pub sentence: String,

    #[schema(
        description = "A translation of the top-level 'sentence' field into the learner's native language."
    )]
    pub translation: String,

    #[schema(
        description = "An explanation in the learner's native language detailing the grammatical structure and vocabulary of the top-level 'sentence' field, clarifying the reasoning behind its translation."
    )]
    pub explanation: String,

    #[schema(
        description = "A list of identified vocabulary and expressions from the target line."
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
b.  `partOfSpeech`: The part of speech of the expression.
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
* **Part-of-Speech Selection**: The value for the `part_of_speech` field MUST be chosen from the list provided in `PART_OF_SPEECH_OPTIONS`.
* **Empty Result**: If no relevant expressions are found, the "items" array should be empty, but the `sentence`, `translation`, and `explanation` fields should still be provided.
* **[CRITICAL] Rule for `sentence` and `exampleSentence` Construction**: Your construction process must follow two steps:
  1.  **Generate the Base `sentence`**: First, you must construct a single, natural, and grammatically complete sentence from the `TARGET_LINE` and its surrounding `CONVERSATION_LOG`. If the `TARGET_LINE` is already a complete sentence, use it. If it is a fragment, combine it with the necessary preceding or succeeding lines. **This complete sentence is the value for the top-level `sentence` field.**
  2.  **Generate each `exampleSentence`**: For each vocabulary item in the `items` array, take the base `sentence` generated in Step 1 and enclose the corresponding `expression` for that item within `<b>` tags. This highlighted version is the value for the `exampleSentence` field within that item.
* **Language Fidelity**: All user-facing explanations (`translation`, `explanation`, `contextualDefinition`, `coreMeaning`) **MUST** be written in the specified `EXPLANATION_LANGUAGE`.
* **Negation Handling**: When extracting a verb from a negative construction (e.g., "didn't finish"), extract the base form (`finish`). The explanations for the verb should define the verb itself, not the negation. The role of the negation should be covered in the main `explanation` field.

# Example

Here is an example of how to apply the rules.

## Scenario

- A user is learning **English** and wants explanations in **Japanese**. (`EXPLANATION_LANGUAGE` is `Japanese`)
- The `PART_OF_SPEECH_OPTIONS` are `["Noun", "Pronoun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Interjection", "Determiner", "Phrasal Verb", "Idiom", "Collocation", "Expression"]`.
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
この文は、2つの節が接続詞 'but' で繋がれた構造をしています。前半の 'I had to pull an all-nighter to get it done' は、「～するために徹夜しなければならなかった」という意味です。後半の 'it's almost there' は「もうすぐだ」「ゴールは近い」という意味の口語表現で、ここではレポートの完成が間近であることを示しています。これらを組み合わせることで、全体の意味が形成されます。

**items**:

- **Item 1**:
  - **expression**: pull an all-nighter
  - **partOfSpeech**: Idiom
  - **contextualDefinition**: 徹夜する
  - **coreMeaning**: 一晩中、特に勉強や仕事のために起きていること。睡眠をとらずに夜を明かすという行為そのものを指す表現。
  - **exampleSentence**: I had to <b>pull an all-nighter</b> to get it done, but it's almost there.
- **Item 2**:
  - **expression**: get something done
  - **partOfSpeech**: Expression
  - **contextualDefinition**: ～を終わらせる、完成させる
  - **coreMeaning**: あるタスクや仕事を完了させる、または誰かに完了させることを示す使役的な表現。ここでは自分自身で終わらせることを指す。
  - **exampleSentence**: I had to pull an all-nighter to <b>get it done</b>, but it's almost there.

# Input

* **LEARNING_LANGUAGE**:  {learning_language}
* **EXPLANATION_LANGUAGE**: {explanation_language}
* **PART_OF_SPEECH_OPTIONS**: [{part_of_speech_options}]
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
    let model = TypedModel::<SentenceMiningResult>::new(&client, "gemini-2.5-flash-lite");
    let result = model.generate_content(prompt).await.map_err(|e| {
        log::error!("Failed to generate content: {}", e);
        "Failed to generate content".to_string()
    })?;

    Ok(result)
}
