use log::{info, warn};
use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};
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
pub fn play_audio(
    app_handle: AppHandle,
    path: String,
    state: State<AudioState>,
) -> Result<(), String> {
    let full_path = app_handle
        .path()
        .resolve(&path, BaseDirectory::AppLocalData)
        .map_err(|e| format!("Failed to resolve path '{}': {}", path, e))?;
    info!("play_audio: {:?}", full_path);

    if let Some(sink) = state.sink.lock().unwrap().as_ref() {
        warn!("Stopping existing audio playback");
        sink.stop();
    }

    // Read the whole file into memory to make the source cloneable
    let file_bytes =
        fs::read(&full_path).map_err(|e| format!("Failed to read audio file: {}", e))?;

    // Store the audio data
    {
        let mut data_guard = state.audio_data.lock().unwrap();
        *data_guard = Some(file_bytes.clone());
    }

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
