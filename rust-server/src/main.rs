extern crate hyper;
extern crate rustc_serialize;
extern crate url;
mod config;
mod handler;

use std::env;
use hyper::Server;

fn main() {
    let config_path = env::args().nth(1).unwrap_or("./config.json".to_string());
    let cfg = config::load(&config_path);
    let port = cfg.port.unwrap_or(8000);
    let site = handler::new(cfg);

    let listen = format!("127.0.0.1:{}", port);
    println!("Listening on {}", listen);
    Server::http(listen.as_ref() as &str).unwrap()
        .handle(site).unwrap();
}
