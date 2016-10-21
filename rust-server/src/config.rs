use rustc_serialize::json;

use std::fs::File;
use std::io::prelude::*;
use std::io::Error;

#[derive(RustcDecodable, Debug)]
pub struct Config {
    pub port: Option<u16>,
    pub email: String,
    pub token: String,
    pub whitelist: Option<Vec<String>>
}

fn stringify(err: Error) -> String {
    format!("{}", err)
}

pub fn load(path: &str) -> Result<Config, String> {
    File::open(path)
        .map_err(stringify)
        .and_then(|mut f| {
            let mut text = String::new();
            f.read_to_string(&mut text)
                .map_err(stringify)
                .map(|_| text)
        })
        .and_then(|text| {
            json::decode(&text).map_err(|e| format!("{}", e))
        })
}
