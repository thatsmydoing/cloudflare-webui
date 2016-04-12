use rustc_serialize::json;

use std::fs::File;
use std::io::prelude::*;

#[derive(RustcDecodable, Debug)]
pub struct Config {
    pub port: Option<u16>,
    pub email: String,
    pub token: String,
    pub whitelist: Vec<String>
}

pub fn load(path: &str) -> Config {
    let mut text = String::new();
    let mut f = File::open(path).unwrap();
    f.read_to_string(&mut text).ok().expect("Failed to load config");
    json::decode(&text).unwrap()
}
