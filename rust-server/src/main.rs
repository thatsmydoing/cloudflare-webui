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
    let site = handler::new(cfg);

    Server::http("127.0.0.1:8000").unwrap()
        .handle(site).unwrap();
}
