use log::{debug, error, info, warn};
use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink, Source};
use serde::Serialize;
use std::fs;
use std::io::{BufReader, Cursor};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager, State};

const POSITION_UPDATE_FREQUENCY: u64 = 1000;

pub struct AudioState {
    pub stream: Mutex<Option<OutputStream>>, // to keep the stream alive
    pub sink: Arc<Mutex<Option<Sink>>>,      // Arc to share between threads
    pub audio_data: Mutex<Option<Vec<u8>>>,
    pub playback_position_tracker: Mutex<Option<thread::JoinHandle<()>>>,
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
            sink: Arc::new(Mutex::new(None)),
            audio_data: Mutex::new(None),
            playback_position_tracker: Mutex::new(None),
        }
    }
}

// Core audio operations (reusable functions)

pub fn analyze_audio_file(
    file_path: &std::path::Path,
    max_peaks: usize,
) -> Result<(AudioInfo, Vec<u8>), String> {
    info!("analyze_audio_file: {:?}", file_path);

    let file_bytes =
        fs::read(file_path).map_err(|e| format!("Failed to read audio file: {}", e))?;

    let cursor = Cursor::new(file_bytes.clone());
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

    let audio_info = AudioInfo {
        duration: duration_ms,
        peaks,
    };

    Ok((audio_info, file_bytes))
}

pub fn create_audio_playback(
    audio_data: &[u8],
    stream: Option<&OutputStream>,
) -> Result<(Option<OutputStream>, Sink), String> {
    info!("create_audio_playback");

    let cursor = Cursor::new(audio_data.to_vec());
    let source = Decoder::try_from(BufReader::new(cursor))
        .map_err(|e| format!("Failed to decode audio from memory: {}", e))?;

    let (stream, sink) = if let Some(stream) = stream {
        let sink = Sink::connect_new(stream.mixer());
        (None, sink)
    } else {
        let stream = OutputStreamBuilder::open_default_stream()
            .map_err(|e| format!("Failed to open audio output stream: {}", e))?;
        let sink = Sink::connect_new(&stream.mixer());
        (Some(stream), sink)
    };

    sink.append(source);

    Ok((stream, sink))
}

pub fn seek_audio_forward(sink: &Sink, position_ms: u32) -> Result<(), String> {
    info!("seek_audio_forward: {}", position_ms);
    let target_pos = Duration::from_millis(position_ms as u64);
    sink.try_seek(target_pos)
        .map_err(|e| format!("Failed to seek audio: {}", e))?;
    Ok(())
}

pub fn seek_audio_backward_with_recreation(
    audio_data: &[u8],
    stream: &OutputStream,
    position_ms: u32,
) -> Result<Sink, String> {
    info!("seek_audio_backward_with_recreation: {}", position_ms);

    let (_, new_sink) = create_audio_playback(audio_data, Some(stream))?;
    seek_audio_forward(&new_sink, position_ms)?;

    Ok(new_sink)
}

// Tauri command wrappers

#[tauri::command]
pub async fn open_audio(
    app_handle: AppHandle,
    path: String,
    max_peaks: usize,
) -> Result<AudioInfo, String> {
    let full_path = app_handle
        .path()
        .resolve(&path, BaseDirectory::AppLocalData)
        .map_err(|e| format!("Failed to resolve path '{}': {}", path, e))?;

    let (audio_info, file_bytes) = analyze_audio_file(&full_path, max_peaks)?;

    // Store audio data in state
    let state: State<AudioState> = app_handle.state();
    let mut audio_data_guard = state.audio_data.lock().unwrap();
    *audio_data_guard = Some(file_bytes);

    Ok(audio_info)
}

#[tauri::command]
pub fn play_audio(app_handle: AppHandle, state: State<AudioState>) -> Result<(), String> {
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        warn!("Stopping existing audio playback");
        sink.stop();
    }

    // Get audio data from state
    let audio_data_guard = state.audio_data.lock().unwrap();
    let file_bytes = audio_data_guard
        .as_ref()
        .ok_or("Audio data not found in state. Call open_audio first.".to_string())?;

    // Play audio
    let (stream, sink) = create_audio_playback(file_bytes, None)?;

    // Store stream and sink in state
    let mut stream_guard = state.stream.lock().unwrap();
    *stream_guard = stream;
    let mut sink_guard = state.sink.lock().unwrap();
    *sink_guard = Some(sink);

    // Start tracking playback position
    let sink_mutex = Arc::clone(&state.sink);
    let tracker_mutex = &state.playback_position_tracker;
    start_playback_position_tracking(app_handle, sink_mutex, tracker_mutex)
        .map_err(|e| format!("Failed to start playback position tracking: {}", e))?;

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
pub fn resume_audio(app_handle: AppHandle, state: State<AudioState>) -> Result<(), String> {
    info!("resume_audio");
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        sink.play();
    }

    let sink_mutex = Arc::clone(&state.sink);
    let tracker_mutex = &state.playback_position_tracker;
    start_playback_position_tracking(app_handle, sink_mutex, tracker_mutex)
        .map_err(|e| format!("Failed to start playback position tracking: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn stop_audio(state: State<AudioState>) -> Result<(), String> {
    info!("stop_audio");
    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        sink.stop();
    }
    stop_playback_position_tracking(state)
        .map_err(|e| format!("Failed to stop playback position tracking: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn seek_audio(
    app_handle: AppHandle,
    position_ms: u32,
    state: State<AudioState>,
) -> Result<(), String> {
    let mut sink_opt = state.sink.lock().unwrap();

    if let Some(sink) = sink_opt.as_mut() {
        let current_pos = sink.get_pos();
        let target_pos = Duration::from_millis(position_ms as u64);
        let is_paused = sink.is_paused();

        if target_pos < current_pos {
            warn!("Seeking backwards. Recreating source from stored data.");

            let data_guard = state.audio_data.lock().unwrap();
            if let Some(audio_data) = data_guard.as_ref() {
                let stream_guard = state.stream.lock().unwrap();
                if let Some(stream) = stream_guard.as_ref() {
                    // Stop the old sink before replacing it.
                    sink.stop();

                    let new_sink =
                        seek_audio_backward_with_recreation(audio_data, stream, position_ms)?;
                    if is_paused {
                        new_sink.pause();
                        app_handle
                            .emit("playback-position", position_ms)
                            .map_err(|e| {
                                format!("Failed to emit playback-position event: {}", e)
                            })?;
                    }

                    // Replace the sink inside the Option.
                    *sink_opt = Some(new_sink);

                    let sink_mutex = Arc::clone(&state.sink);
                    let tracker_mutex = &state.playback_position_tracker;
                    start_playback_position_tracking(app_handle, sink_mutex, tracker_mutex)
                        .map_err(|e| {
                            format!("Failed to start playback position tracking: {}", e)
                        })?;
                } else {
                    error!("No audio stream found in state");
                    return Err("No audio stream in state".to_string());
                }
            } else {
                error!("No audio source stored in state");
                return Err("No audio source stored".to_string());
            }
        } else {
            seek_audio_forward(sink, position_ms)?;
            app_handle
                .emit("playback-position", position_ms)
                .map_err(|e| format!("Failed to emit playback-position event: {}", e))?;
        }
    } else {
        // Get audio data from state
        let audio_data_guard = state.audio_data.lock().unwrap();
        let file_bytes = audio_data_guard
            .as_ref()
            .ok_or("Audio data not found in state. Call open_audio first.".to_string())?;

        // Play audio
        let (stream, sink) = create_audio_playback(file_bytes, None)?;
        seek_audio_forward(&sink, position_ms)?;
        sink.pause();
        app_handle
            .emit("playback-position", position_ms)
            .map_err(|e| format!("Failed to emit playback-position event: {}", e))?;

        // Store stream and sink in state
        let mut stream_guard = state.stream.lock().unwrap();
        *stream_guard = stream;
        *sink_opt = Some(sink);

        // Start tracking playback position
        let sink_mutex = Arc::clone(&state.sink);
        let tracker_mutex = &state.playback_position_tracker;
        start_playback_position_tracking(app_handle, sink_mutex, tracker_mutex)
            .map_err(|e| format!("Failed to start playback position tracking: {}", e))?;
    }

    Ok(())
}

pub fn start_playback_position_tracking(
    app_handle: AppHandle,
    sink_mutex: Arc<Mutex<Option<Sink>>>,
    tracker_mutex: &Mutex<Option<thread::JoinHandle<()>>>,
) -> Result<(), String> {
    info!("start_playback_position_tracking");
    let mut tracker_guard = tracker_mutex
        .lock()
        .map_err(|e| format!("Failed to lock tracker mutex: {}", e))?;

    // Stop any existing tracker
    if let Some(_handle) = tracker_guard.take() {
        warn!("Stopping existing playback position tracker.");
        // It's not straightforward to "stop" a thread from outside.
        // For now, we'll just drop the handle, assuming the thread will eventually
        // terminate if the sink is stopped or dropped.
        // A more robust solution would involve a channel for signaling termination.
    }

    let app_handle_clone = app_handle.clone();

    let mut emit_error_count = 0;
    let handle = thread::spawn(move || {
        loop {
            let (should_break, current_pos_ms) = {
                let sink_locked = sink_mutex.lock().unwrap();
                if let Some(sink) = sink_locked.as_ref() {
                    if sink.is_paused() || sink.empty() {
                        info!("Playback paused or empty, stopping tracker thread.");
                        (true, 0)
                    } else {
                        (false, sink.get_pos().as_millis() as u64)
                    }
                } else {
                    info!("No sink available, stopping tracker thread.");
                    (true, 0)
                }
            };
            if should_break {
                break;
            }

            if let Err(e) = app_handle_clone.emit("playback-position", current_pos_ms) {
                error!("Failed to emit playback-position event: {}", e);
                emit_error_count += 1;
                if emit_error_count >= 5 {
                    error!("Too many emit errors, stopping playback position tracker thread.");
                    break;
                }
            }

            thread::sleep(Duration::from_millis(POSITION_UPDATE_FREQUENCY));
        }
        info!("Playback position tracker thread terminated.");
    });

    *tracker_guard = Some(handle);
    Ok(())
}

pub fn stop_playback_position_tracking(state: State<AudioState>) -> Result<(), String> {
    info!("stop_playback_position_tracking");
    let mut tracker_guard = state.playback_position_tracker.lock().unwrap();
    if let Some(handle) = tracker_guard.take() {
        // Attempt to join the thread. This will block until the thread finishes.
        // In a real application, you might want to send a signal to the thread
        // to allow it to terminate gracefully without blocking the main thread.
        if let Err(e) = handle.join() {
            error!("Failed to join playback position tracker thread: {:?}", e);
        }
    }
    Ok(())
}
