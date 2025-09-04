use log::{debug, info, warn};
use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink, Source};
use serde::Serialize;
use std::fs;
use std::io::{BufReader, Cursor};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{path::BaseDirectory, AppHandle, Manager, State};

pub struct AudioState {
    pub stream: Mutex<Option<OutputStream>>, // to keep the stream alive
    pub sink: Mutex<Option<Sink>>,
    pub audio_data: Mutex<Option<Vec<u8>>>,
}

#[derive(Serialize, Clone)]
pub struct AudioInfo {
    duration: u64,
    peaks: Vec<f32>,
}

impl Default for AudioState {
    fn default() -> Self {
        Self {
            stream: Mutex::new(None),
            sink: Mutex::new(None),
            audio_data: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn open_audio(
    app_handle: AppHandle,
    state: State<AudioState>,
    path: String,
    max_peaks: usize,
) -> Result<AudioInfo, String> {
    let full_path = app_handle
        .path()
        .resolve(&path, BaseDirectory::AppLocalData)
        .map_err(|e| format!("Failed to resolve path '{}': {}", path, e))?;
    info!("open_audio: {:?}", full_path);

    let file_bytes =
        fs::read(&full_path).map_err(|e| format!("Failed to read audio file: {}", e))?;

    // Store audio data in state
    {
        let mut audio_data_guard = state.audio_data.lock().unwrap();
        *audio_data_guard = Some(file_bytes.clone());
    }

    let cursor = Cursor::new(file_bytes);
    let source = Decoder::try_from(BufReader::new(cursor))
        .map_err(|e| format!("Failed to decode audio from memory: {}", e))?;

    // 1. 音声全体の時間を取得
    let duration = source
        .total_duration()
        .ok_or_else(|| "Could not get duration from audio source".to_string())?;
    let duration_ms = duration.as_millis() as u64;
    debug!("Audio duration: {} ms", duration_ms);

    // 2. ピーク波形を計算
    // サンプルをf32に変換して収集
    let samples: Vec<f32> = source.map(|s| s as f32 / i16::MAX as f32).collect();
    let num_samples = samples.len();

    let peaks = if max_peaks > 0 && num_samples > 0 {
        let chunk_size = (num_samples as f64 / max_peaks as f64).ceil() as usize;
        if chunk_size > 0 {
            let raw_peaks: Vec<f32> = samples
                .chunks(chunk_size)
                .map(|chunk| chunk.iter().map(|&s| s.abs()).fold(0.0f32, |a, b| a.max(b)))
                .collect();
            let max_peak = raw_peaks.iter().cloned().fold(0. / 0., f32::max).max(1e-6); // avoid division by zero
            raw_peaks.iter().map(|&p| p / max_peak).collect()
        } else {
            vec![]
        }
    } else {
        vec![]
    };
    debug!("Calculated {} peaks", peaks.len());

    Ok(AudioInfo {
        duration: duration_ms,
        peaks,
    })
}

#[tauri::command]
pub fn play_audio(state: State<AudioState>) -> Result<(), String> {
    info!("play_audio");

    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        warn!("Stopping existing audio playback");
        sink.stop();
    }

    let audio_data_guard = state.audio_data.lock().unwrap();
    let file_bytes = audio_data_guard
        .as_ref()
        .ok_or("Audio data not found in state. Call open_audio first.".to_string())?
        .clone();

    let cursor = Cursor::new(file_bytes);
    let source = Decoder::try_from(BufReader::new(cursor))
        .map_err(|e| format!("Failed to decode audio from memory: {}", e))?;

    let stream = OutputStreamBuilder::open_default_stream()
        .map_err(|e| format!("Failed to open audio output stream: {}", e))?;
    let sink = Sink::connect_new(&stream.mixer());

    sink.append(source);

    let mut stream_guard = state.stream.lock().unwrap();
    *stream_guard = Some(stream);
    let mut sink_guard = state.sink.lock().unwrap();
    *sink_guard = Some(sink);

    Ok(())
}

#[tauri::command]
pub fn pause_audio(state: State<AudioState>) -> Result<(), String> {
    info!("pause_audio");
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        sink.pause();
    }
    Ok(())
}

#[tauri::command]
pub fn resume_audio(state: State<AudioState>) -> Result<(), String> {
    info!("resume_audio");
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        sink.play();
    }
    Ok(())
}

#[tauri::command]
pub fn stop_audio(state: State<AudioState>) -> Result<(), String> {
    info!("stop_audio");
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        sink.stop();
    }
    Ok(())
}

#[tauri::command]
pub fn seek_audio(position_ms: u32, state: State<AudioState>) -> Result<(), String> {
    info!("seek_audio: {}", position_ms);
    let mut sink_opt = state.sink.lock().unwrap();

    if let Some(sink) = sink_opt.as_mut() {
        let current_pos = sink.get_pos();
        let target_pos = Duration::from_millis(position_ms as u64);

        if target_pos < current_pos {
            warn!("Seeking backwards. Recreating source from stored data.");

            let data_guard = state.audio_data.lock().unwrap();
            if let Some(audio_data) = data_guard.as_ref() {
                // Create new source from cached data
                let cursor = Cursor::new(audio_data.clone());
                let new_source = Decoder::try_from(BufReader::new(cursor))
                    .map_err(|e| format!("Failed to decode audio from memory: {}", e))?;

                let stream_guard = state.stream.lock().unwrap();
                if let Some(stream) = stream_guard.as_ref() {
                    // Stop the old sink before replacing it.
                    sink.stop();

                    let new_sink = Sink::connect_new(&stream.mixer());
                    new_sink.append(new_source);
                    new_sink
                        .try_seek(target_pos)
                        .map_err(|e| format!("Failed to seek on new sink: {}", e))?;

                    // Replace the sink inside the Option.
                    *sink_opt = Some(new_sink);
                } else {
                    return Err("No audio stream in state".to_string());
                }
            } else {
                return Err("No audio source stored".to_string());
            }
        } else {
            // Seek forwards
            sink.try_seek(target_pos)
                .map_err(|e| format!("Failed to seek audio: {}", e))?;
        }
    }
    Ok(())
}
