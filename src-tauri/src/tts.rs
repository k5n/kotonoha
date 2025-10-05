use log::{error, info};
use piper_rs::synth::{AudioOutputConfig, PiperSpeechSynthesizer};
use serde::Serialize;
use std::{
    num::{NonZero, NonZeroU32},
    path::PathBuf,
};
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager};
use vorbis_rs::{VorbisBitrateManagementStrategy, VorbisEncoder, VorbisEncoderBuilder};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TtsProgressPayload {
    progress: u8, // 0-100
    start_ms: u32,
    end_ms: u32,
    text: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TtsFinishedPayload {
    media_path: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TtsErrorPayload {
    error_message: String,
}

fn create_piper_synthesizer(
    config_absolute_path: &PathBuf,
) -> Result<PiperSpeechSynthesizer, String> {
    let model = piper_rs::from_config_path(config_absolute_path)
        .map_err(|e| format!("Could not load model: {:?}", e))?;
    let synth = PiperSpeechSynthesizer::new(model)
        .map_err(|e| format!("Could not create synthesizer: {:?}", e))?;
    Ok(synth)
}

fn create_vorbis_encoder(
    output: &mut Vec<u8>,
    sample_rate: u32,
    channels: u8,
) -> Result<VorbisEncoder<&mut Vec<u8>>, String> {
    let encoder = VorbisEncoderBuilder::new(
        NonZero::new(sample_rate).ok_or("Sample rate must be non-zero")?,
        NonZero::new(channels).ok_or("Channels must be non-zero")?,
        output,
    )
    .map_err(|e| format!("Could not create encoder: {:?}", e))?
    .bitrate_management_strategy(VorbisBitrateManagementStrategy::Abr {
        average_bitrate: NonZeroU32::new(32000).ok_or("Bitrate must be non-zero")?,
    })
    .build()
    .map_err(|e| format!("Could not build encoder: {:?}", e))?;
    Ok(encoder)
}

fn process_tts<F>(
    synthesizer: &PiperSpeechSynthesizer,
    encoder: &mut VorbisEncoder<&mut Vec<u8>>,
    sample_rate: u32,
    margin_silence_ms: u32,
    transcript: &str,
    mut callback: F,
) -> Result<(), String>
where
    F: FnMut(u8, u32, u32, String) -> (),
{
    let mut current_ms = 0_f64;

    let silence = vec![0.0_f32; (sample_rate * margin_silence_ms / 1000) as usize];
    let margin_silence_ms = silence.len() as f64 * 1000.0 / sample_rate as f64;
    encoder
        .encode_audio_block([silence.as_slice()])
        .map_err(|e| format!("Could not encode audio block: {:?}", e))?;
    current_ms += margin_silence_ms;

    let output_config = AudioOutputConfig {
        rate: None,
        pitch: None,
        volume: Some(80),
        appended_silence_ms: None,
    };

    // Pre-calc non-empty lines to compute per-line progress
    let lines: Vec<&str> = transcript
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();
    let total_lines = lines.len().max(1); // avoid div-by-zero

    for (idx, &line) in lines.iter().enumerate() {
        let mut samples: Vec<f32> = Vec::new();
        let speech_stream = synthesizer
            .synthesize_parallel(line.to_string(), Some(output_config.clone()))
            .map_err(|e| format!("Could not synthesize speech: {:?}", e))?;
        for result in speech_stream {
            match result {
                Ok(ws) => {
                    samples.append(&mut ws.into_vec());
                }
                Err(e) => {
                    return Err(format!("Synthesis error: {:?}", e));
                }
            };
        }

        encoder
            .encode_audio_block([silence.as_slice()])
            .map_err(|e| format!("Could not encode leading silence audio block: {:?}", e))?;
        current_ms += margin_silence_ms;
        let start_ms = current_ms;
        encoder
            .encode_audio_block([samples.as_slice()])
            .map_err(|e| {
                format!(
                    "Could not encode synthesized audio block (line: {}): {:?}",
                    line, e
                )
            })?;
        current_ms += samples.len() as f64 * 1000.0 / sample_rate as f64;
        encoder
            .encode_audio_block([silence.as_slice()])
            .map_err(|e| format!("Could not encode trailing silence audio block: {:?}", e))?;
        current_ms += margin_silence_ms;

        let progress = (((idx + 1) * 100) / total_lines) as u8;

        callback(
            progress,
            start_ms.round() as u32,
            current_ms.round() as u32,
            line.to_string(),
        );
    }
    Ok(())
}

fn process_all_tts(
    app_handle: &AppHandle,
    config_path: &String,
    sample_rate: u32,
    channels: u8,
    margin_silence_ms: u32,
    transcript: &str,
    output_path: &str,
) -> Result<(), String> {
    assert!(channels == 1, "Only mono audio is supported");

    let config_absolute_path = app_handle
        .path()
        .resolve(config_path, BaseDirectory::AppLocalData)
        .map_err(|e| format!("Could not resolve config path: {:?}", e))?;
    let synthesizer = create_piper_synthesizer(&config_absolute_path)?;

    let mut transcoded_ogg = vec![];
    let mut encoder = create_vorbis_encoder(&mut transcoded_ogg, sample_rate, channels)?;

    process_tts(
        &synthesizer,
        &mut encoder,
        sample_rate,
        margin_silence_ms,
        transcript,
        |status, start, end, line| {
            app_handle
                .emit(
                    "tts-progress",
                    TtsProgressPayload {
                        progress: status,
                        start_ms: start,
                        end_ms: end,
                        text: line.clone(),
                    },
                )
                .unwrap_or_else(|e| {
                    error!("Could not emit tts-progress event: {:?}", e);
                });
        },
    )?;

    encoder
        .finish()
        .map_err(|e| format!("Could not finish encoding: {:?}", e))?;

    let output_absolute_path = app_handle
        .path()
        .resolve(&output_path, BaseDirectory::AppLocalData)
        .map_err(|e| format!("Could not resolve output path: {:?}", e))?;
    info!("TTS output path: {:?}", output_absolute_path);

    std::fs::write(&output_absolute_path, transcoded_ogg)
        .map_err(|e| format!("Could not write output file: {:?}", e))?;

    app_handle
        .emit(
            "tts-finished",
            TtsFinishedPayload {
                media_path: output_path.to_string(),
            },
        )
        .map_err(|e| format!("Could not emit tts-finished event: {:?}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn start_tts(
    app_handle: AppHandle,
    transcript: String,
    config_path: String,
    output_path: String,
) -> Result<(), String> {
    const SAMPLE_RATE: u32 = 22050;
    const CHANNELS: u8 = 1;
    const MARGIN_SILENCE_MS: u32 = 500;

    process_all_tts(
        &app_handle,
        &config_path,
        SAMPLE_RATE,
        CHANNELS,
        MARGIN_SILENCE_MS,
        &transcript,
        &output_path,
    )
    .map_err(|e| {
        error!("TTS processing error: {}", e);
        app_handle
            .emit(
                "tts-error",
                TtsErrorPayload {
                    error_message: e.clone(),
                },
            )
            .unwrap_or_else(|emit_err| {
                error!("Could not emit tts-error event: {:?}", emit_err);
            });
        e
    })?;

    Ok(())
}
