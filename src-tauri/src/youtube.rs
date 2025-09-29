use log::{error, info};
use prost::Message;
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AtomicDialogue {
    pub start_time_ms: u32,
    pub end_time_ms: Option<u32>,
    pub original_text: String,
}

// Protocol Buffers message definitions
#[derive(Clone, PartialEq, Message)]
struct TranscriptParams {
    #[prost(string, optional, tag = "1")]
    track_kind: Option<String>,
    #[prost(string, tag = "2")]
    language: String,
}

#[derive(Clone, PartialEq, Message)]
struct OuterParams {
    #[prost(string, tag = "1")]
    video_id: String,
    #[prost(string, tag = "2")]
    inner_params: String,
}

fn uint8_to_base64(bytes: &[u8]) -> String {
    use base64::{engine::general_purpose, Engine as _};
    general_purpose::STANDARD.encode(bytes)
}

fn convert_to_base64_protobuf(
    track_kind: Option<String>,
    language: String,
) -> Result<String, String> {
    let inner_params = TranscriptParams {
        track_kind,
        language,
    };

    let mut inner_buf = Vec::new();
    inner_params
        .encode(&mut inner_buf)
        .map_err(|e| e.to_string())?;
    let inner_base64 = uint8_to_base64(&inner_buf);

    Ok(inner_base64)
}

fn create_request_params(
    video_id: String,
    language: String,
    track_kind: String,
) -> Result<String, String> {
    let track_kind_param = if track_kind == "asr" {
        Some(track_kind)
    } else {
        None
    };

    let inner_base64 = convert_to_base64_protobuf(track_kind_param, language)?;

    let outer_params = OuterParams {
        video_id,
        inner_params: inner_base64,
    };

    let mut outer_buf = Vec::new();
    outer_params
        .encode(&mut outer_buf)
        .map_err(|e| e.to_string())?;
    let outer_base64 = uint8_to_base64(&outer_buf);

    Ok(outer_base64)
}

fn extract_text_from_snippet(snippet: Option<&serde_json::Value>) -> String {
    if let Some(snippet) = snippet {
        // Try simpleText first
        if let Some(simple_text) = snippet.get("simpleText").and_then(|v| v.as_str()) {
            return simple_text.to_string();
        }

        // Try runs array
        if let Some(runs) = snippet.get("runs").and_then(|v| v.as_array()) {
            let mut text = String::new();
            for run in runs {
                if let Some(run_text) = run.get("text").and_then(|v| v.as_str()) {
                    text.push_str(run_text);
                }
            }
            return text;
        }
    }

    String::new()
}

#[tauri::command]
pub async fn fetch_youtube_subtitle(
    video_id: String,
    language: String,
    track_kind: String,
) -> Result<Vec<AtomicDialogue>, String> {
    info!("Fetching YouTube subtitle for video: {}", video_id);

    let url = "https://www.youtube.com/youtubei/v1/get_transcript";

    let params = create_request_params(video_id.clone(), language, track_kind)?;

    let request_body = serde_json::json!({
        "context": {
            "client": {
                "clientName": "WEB",
                "clientVersion": "2.20240826.01.00"
            }
        },
        "params": params
    });

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| {
            error!("Failed to send request: {}", e);
            e.to_string()
        })?;

    if !response.status().is_success() {
        let status = response.status();
        error!("Failed to fetch subtitles: {}", status);
        return Err(format!("Failed to fetch subtitles: {}", status));
    }

    let json: serde_json::Value = response.json().await.map_err(|e| {
        error!("Failed to parse response JSON: {}", e);
        e.to_string()
    })?;

    let initial_segments = json
        .get("actions")
        .and_then(|actions| actions.get(0))
        .and_then(|action| action.get("updateEngagementPanelAction"))
        .and_then(|panel| panel.get("content"))
        .and_then(|content| content.get("transcriptRenderer"))
        .and_then(|renderer| renderer.get("content"))
        .and_then(|content| content.get("transcriptSearchPanelRenderer"))
        .and_then(|panel| panel.get("body"))
        .and_then(|body| body.get("transcriptSegmentListRenderer"))
        .and_then(|renderer| renderer.get("initialSegments"))
        .and_then(|segments| segments.as_array());

    let segments = match initial_segments {
        Some(segments) => segments,
        None => {
            error!("No subtitles found for video: {}", video_id);
            return Err(format!("No subtitles found for video: {}", video_id));
        }
    };

    let mut dialogues = Vec::new();

    for segment in segments {
        let segment_data = segment
            .get("transcriptSectionHeaderRenderer")
            .or_else(|| segment.get("transcriptSegmentRenderer"));

        if let Some(data) = segment_data {
            let start_ms = data
                .get("startMs")
                .and_then(|v| v.as_str())
                .and_then(|s| s.parse::<u32>().ok())
                .unwrap_or(0);

            let end_ms = data
                .get("endMs")
                .and_then(|v| v.as_str())
                .and_then(|s| s.parse::<u32>().ok());

            let text = extract_text_from_snippet(data.get("snippet"));

            if !text.is_empty() {
                dialogues.push(AtomicDialogue {
                    start_time_ms: start_ms,
                    end_time_ms: end_ms,
                    original_text: text,
                });
            }
        }
    }

    info!("Successfully fetched {} subtitle segments", dialogues.len());
    Ok(dialogues)
}

// cSpell:ignore Patb TRIMQ
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_request_params_asr_en() {
        let video_id = "QVPatbYvFmM".to_string();
        let track_kind = "asr".to_string();
        let language = "en".to_string();

        let params = create_request_params(video_id, language, track_kind)
            .expect("create_request_params failed");
        assert_eq!(params, "CgtRVlBhdGJZdkZtTRIMQ2dOaGMzSVNBbVZ1");
    }
}
