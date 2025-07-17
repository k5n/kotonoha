// cSpell:words HWID
use argon2::{hash_raw, Config, Variant, Version};
use machineid_rs::{Encryption, HWIDComponent, IdBuilder};

/// Generates a hardware ID (HWID) for the system.
fn get_hwid() -> String {
    const HWID_KEY: &str = "3f8b0c3b519340974b0fa3aad09939402d969f52f1d84a4abac56f17e32623ba";
    IdBuilder::new(Encryption::SHA256)
        .add_component(HWIDComponent::SystemID)
        .add_component(HWIDComponent::Username)
        .build(HWID_KEY)
        .unwrap_or_else(|_| HWID_KEY.to_string())
}

/// password hashing function for stronghold plugin
pub fn password_hash_function(_password: &str) -> Vec<u8> {
    let config = Config {
        lanes: 4,
        mem_cost: 10_000,
        time_cost: 10,
        variant: Variant::Argon2id,
        version: Version::Version13,
        ..Default::default()
    };
    let salt = "kotonoha".as_bytes();
    let password = get_hwid();
    hash_raw(password.as_ref(), salt, &config)
        .expect("failed to hash password")
        .to_vec()
}
