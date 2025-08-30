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
        description = "The part of speech or type of the expression, chosen from the predefined PART_OF_SPEECH_OPTIONS list provided in the input."
    )]
    #[serde(rename = "partOfSpeech")]
    pub part_of_speech: String,

    #[schema(
        description = "A concise, direct definition of the expression in the learner's native language, explaining its meaning *specifically as used in the target sentence*. Avoid overtly explanatory or redundant phrasing."
    )]
    #[serde(rename = "contextualDefinition")]
    pub contextual_definition: String,

    #[schema(
        description = "A detailed, core meaning explanation of the expression in the learner's native language."
    )]
    #[serde(rename = "coreMeaning")]
    pub core_meaning: String,

    #[schema(
        description = "The original target sentence with the identified expression highlighted using <b> tags."
    )]
    #[serde(rename = "exampleSentence")]
    pub example_sentence: String,
}

#[derive(AsSchema, Deserialize, Serialize)]
#[schema(description = "Result of sentence mining analysis.")]
pub struct SentenceMiningResult {
    #[schema(
        description = "A translation of the target sentence into the learner's native language."
    )]
    pub translation: String,

    #[schema(description = "A explanation of the reasoning behind the translation.")]
    pub explanation: String,

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
You are an expert linguistic assistant for language learners. Your **main task** is to analyze a sentence within its context, identify important vocabulary and expressions that a learner might not know, and provide clear, concise explanations in their native language. As **sub-tasks**, you will provide a translation and explain the reasoning behind the translation.

# Task
Analyze the `TARGET_SENTENCE` below. It is part of a larger conversation provided in the `CONTEXT`.

### Main Task: Identify Key Vocabulary and Expressions
Your analysis will proceed in two steps:

**Step 1: Identify Phrases**
First, identify all significant multi-word units such as phrasal verbs, idioms, and common collocations from the `TARGET_SENTENCE`.

**Step 2: Identify Key Words**
Next, identify important individual words that a learner might not know. This includes:
a.  Key words that are part of the phrases identified in Step 1.
b.  Any other standalone key words in the sentence.

**For each item identified in both steps**, you must:
a.  Extract the expression. If it's a verb, provide its base form (lemma).
b.  Provide its part of speech.
c.  Write a **concise, contextual definition** in the `contextualDefinition` field, in the specified `EXPLANATION_LANGUAGE`. This definition should be a brief explanation of the **meaning of the extracted expression itself**, , **without** any overtly explanatory or redundant phrasing. 
d.  Write a **detailed, core meaning explanation** in the `coreMeaning` field, in the specified `EXPLANATION_LANGUAGE`. This explanation must describe the fundamental, general meaning of the word or phrase, independent of the specific sentence context.
e.  Provide the original `TARGET_SENTENCE` with the expression highlighted using `<b>` tags.

### Sub-Tasks: Provide Translation and Explanation
1.  Translate the entire `TARGET_SENTENCE` into the `EXPLANATION_LANGUAGE`.
2.  Provide a clear explanation in the `EXPLANATION_LANGUAGE` for why the sentence is translated as such. This explanation should break down the grammatical structure, explain the role of key phrases, and show how the identified vocabulary contributes to the overall meaning.

# Rules
* **Principle of Direct Definition**: This is the most important rule. The contextualDefinition and coreMeaning fields **must always be a direct definition of the exact text extracted in the `expression` field**. Do not define a different word or a modified version of the expression. All other rules operate under this principle.
* **Filtering**: Do NOT extract extremely basic, common words (e.g., CEFR A1 level words like 'the', 'a', 'is', 'go', 'I', 'you'). Focus on words and phrases an intermediate learner would find challenging.
* **Comprehensive Identification**: You must identify both multi-word units (phrasal verbs, idioms, etc.) and important individual words. When you identify a phrase, also consider extracting its key component words separately if they are likely to be unknown to an intermediate learner.
* **Part-of-Speech Selection**: The value for the `part_of_speech` field MUST be chosen from the list provided in `PART_OF_SPEECH_OPTIONS` in the `Input`.
* **Empty Result**: If no relevant expressions are found, return a JSON object with an empty "items" array, but still provide the `translation` and `explanation`.
* **Character Encoding**: Ensure all content within the JSON is properly escaped.
* **Highlighting**: For the `exampleSentence` field, *always* enclose the extracted `expression` within `<b>` tags. Ensure the highlighting is precise and covers only the identified expression.
* **Language Fidelity**: All user-facing explanations, including the fields `translation`, `explanation`, `contextualDefinition`, and `coreMeaning`, **MUST** be written in the specified `EXPLANATION_LANGUAGE`. This is a critical instruction.
* **Negation Handling**: When a verb is part of a negative construction (e.g., "didn't finish") and you extract only the verb's base form (`finish`) as `expression`, the explanations for this verb (both `contextualDefinition` and `coreMeaning`) must describe the meaning of the verb itself ("finish"), not the combined negative meaning of the phrase ("not finish"). The negation itself should be explained in the final `explanation` for the entire sentence.

# Example

Here is an example of how to apply the rules.

**Scenario:**
- A user is learning **English** and wants explanations in **Japanese**. (`EXPLANATION_LANGUAGE` is `Japanese`)
- The `PART_OF_SPEECH_OPTIONS` are `["Noun", "Pronoun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Interjection", "Determiner", "Phrasal Verb", "Idiom", "Collocation", "Expression"]`.
- The conversation context is:
  > Are you sure you want to lead this new project?
  > It's a huge responsibility.
  > Yes, I've thought about it carefully.
  > Signing the contract means I'm making a serious commitment.
  > I'm glad to hear that.
  > I'm counting on you.
- The `TARGET_SENTENCE` to be analyzed is:
  > Signing the contract means I'm making a serious commitment.

**Expected Output:**

Below is the expected output format. Do not include the field names in the final JSON output; they are for explanation only.

**translation**:
契約に署名するということは、私が真剣な約束をするということを意味します。

**explanation**:
この文は、「契約に署名すること」を意味する動名詞句 Signing the contract が主語になっています。これが means (〜を意味する) の主語として機能し、その目的語として I'm making a serious commitment という節が続いています（接続詞thatが省略されています）。キーフレーズは making a serious commitment で、「真剣な約束をする」という強い意志を表しています。commitment と contract が文意を理解する上で重要な名詞です。

**items**:
- **Item 1**:
  - **expression**: make a commitment
  - **partOfSpeech**: Collocation
  - **contextualDefinition**: 真剣な約束をする
  - **coreMeaning**: 何かに対して責任を持って関わること、あるいは時間や労力を捧げることを約束する、という強い意志を表す表現。
  - **exampleSentence**: Signing the contract means I'm <b>making a serious commitment</b>.
- **Item 2**:
  - **expression**: commitment
  - **partOfSpeech**: Noun
  - **contextualDefinition**: 約束、誓約
  - **coreMeaning**: 将来何かを行うという約束や、特定の仕事・活動に対する献身や専念のこと。責任を伴う強い約束を指す。
  - **exampleSentence**: Signing the contract means I'm making a serious <b>commitment</b>.
- **Item 3**:
  - **expression**: contract
  - **partOfSpeech**: Noun
  - **contextualDefinition**: 契約（書）
  - **coreMeaning**: 2者以上の当事者間で法的な拘束力を持つ公式な合意、またはその合意を記した書類。
  - **exampleSentence**: Signing the <b>contract</b> means I'm making a serious commitment.


# Input
* **LEARNING_LANGUAGE**:  {learning_language}
* **EXPLANATION_LANGUAGE**: {explanation_language}
* **PART_OF_SPEECH_OPTIONS**: [{part_of_speech_options}]
* **CONTEXT**:
```
{context}
```
* **TARGET_SENTENCE**:
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
