use keyring::Entry;
use log;
use rand::{
    distr::{Alphanumeric, SampleString},
    RngCore,
};
use std::{fs, path::Path};

const SERVICE_NAME: &str = "com.k5-n.kotonoha.mining";
const PASSWORD_USERNAME: &str = "stronghold-password";

fn generate_random_bytes(len: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; len];
    rand::rng().fill_bytes(&mut bytes);
    bytes
}

fn generate_random_password(len: usize) -> String {
    Alphanumeric.sample_string(&mut rand::rng(), len)
}

fn get_or_create_password() -> Result<String, keyring::Error> {
    let entry = Entry::new(SERVICE_NAME, PASSWORD_USERNAME)?;
    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => {
            let new_password = generate_random_password(32);
            log::debug!(
                "Generated new stronghold password: length {}",
                new_password.len()
            );
            entry.set_password(&new_password)?;
            Ok(new_password)
        }
        Err(e) => Err(e),
    }
}

pub fn create_salt_file_if_not_exists(salt_path: &Path) -> std::io::Result<()> {
    if !salt_path.exists() {
        let salt = generate_random_bytes(16)
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>();
        fs::write(salt_path, salt)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_stronghold_password() -> Result<String, String> {
    get_or_create_password().map_err(|e| e.to_string())
}
