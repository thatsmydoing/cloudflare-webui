#[macro_use]
extern crate mime;
extern crate hyper;
extern crate rustc_serialize;
extern crate sha1;
mod config;
mod handler;

use std::env;
use std::process;
use hyper::Server;

fn actual_main() -> i32 {
    let config_path = env::args().nth(1).unwrap_or("./config.json".to_string());
    println!("Loading configuration from {}", config_path);
    let cfg = match config::load(&config_path) {
        Ok(cfg) => cfg,
        Err(err) => {
            println!("Failed to load configuration: {}", err);
            return 1;
        }
    };
    let port = cfg.port.unwrap_or(8000);
    let site = handler::new(cfg);

    let listen = format!("127.0.0.1:{}", port);
    println!("Listening on {}", listen);
    Server::http(listen.as_ref() as &str).unwrap()
        .handle(site).unwrap();
    return 0;
}

fn main() {
    let exit_code = actual_main();
    process::exit(exit_code);
}
