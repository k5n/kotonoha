// cSpell:words Bokmal Sotho Tsonga
use lingua::{Language, LanguageDetector, LanguageDetectorBuilder};

// map detected lingua::Language to BCP-47 / Gemini key
fn language_to_bcp47(lang: Language) -> Option<String> {
    // Use ISO 639-1 primary subtag when available.
    // IsoCode639_1 implements Display so we can stringify and lowercase.
    let iso1 = lang.iso_code_639_1().to_string().to_lowercase();

    // Special-case mappings where Gemini uses a different primary subtag.
    let mapped = match lang {
        Language::Bokmal | Language::Nynorsk => "no".to_string(),
        Language::Tagalog => "fil".to_string(),
        Language::Hebrew => "he".to_string(),
        // Default: use iso1 produced above
        _ => iso1,
    };

    Some(mapped)
}

#[tauri::command]
pub fn detect_language_from_text(text: String) -> Option<String> {
    let languages = vec![
        Language::Afrikaans,
        Language::Albanian,
        Language::Arabic,
        Language::Armenian,
        Language::Azerbaijani,
        Language::Basque,
        Language::Belarusian,
        Language::Bengali,
        Language::Bokmal,
        Language::Bosnian,
        Language::Bulgarian,
        Language::Catalan,
        Language::Chinese,
        Language::Croatian,
        Language::Czech,
        Language::Danish,
        Language::Dutch,
        Language::English,
        Language::Esperanto,
        Language::Estonian,
        Language::Finnish,
        Language::French,
        Language::Ganda,
        Language::Georgian,
        Language::German,
        Language::Greek,
        Language::Gujarati,
        Language::Hebrew,
        Language::Hindi,
        Language::Hungarian,
        Language::Icelandic,
        Language::Indonesian,
        Language::Irish,
        Language::Italian,
        Language::Japanese,
        Language::Kazakh,
        Language::Korean,
        Language::Latin,
        Language::Latvian,
        Language::Lithuanian,
        Language::Maori,
        Language::Macedonian,
        Language::Mongolian,
        Language::Marathi,
        Language::Malay,
        Language::Bokmal,
        Language::Nynorsk,
        Language::Punjabi,
        Language::Polish,
        Language::Portuguese,
        Language::Romanian,
        Language::Russian,
        Language::Slovak,
        Language::Slovene,
        Language::Shona,
        Language::Somali,
        Language::Sotho,
        Language::Spanish,
        Language::Swahili,
        Language::Swedish,
        Language::Tagalog,
        Language::Tamil,
        Language::Telugu,
        Language::Thai,
        Language::Turkish,
        Language::Tsonga,
        Language::Tswana,
        Language::Ukrainian,
        Language::Urdu,
        Language::Vietnamese,
        Language::Welsh,
        Language::Xhosa,
        Language::Yoruba,
        Language::Chinese,
        Language::Zulu,
    ];
    let detector: LanguageDetector = LanguageDetectorBuilder::from_languages(&languages)
        .with_low_accuracy_mode()
        .build();
    let detected_language: Option<Language> = detector.detect_language_of(&text);

    detected_language.and_then(language_to_bcp47)
}
