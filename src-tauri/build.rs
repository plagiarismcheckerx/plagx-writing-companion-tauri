fn main() {
    // Google Play requires 64-bit Android libraries aligned to 16 KB memory pages
    // (Android 15+). Set here, not in .cargo/config.toml: the Tauri Android build
    // passes its own RUSTFLAGS, which replace config-file rustflags.
    let os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let width = std::env::var("CARGO_CFG_TARGET_POINTER_WIDTH").unwrap_or_default();
    if os == "android" && width == "64" {
        println!("cargo:rustc-link-arg=-Wl,-z,max-page-size=16384");
    }

    tauri_build::build()
}
