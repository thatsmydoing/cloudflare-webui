use config::Config;
use mime::Mime;
use std::io;
use std::io::Read;
use hyper::{Get, Post};
use hyper::Client;
use hyper::client;
use hyper::header::{ContentType, Headers};
use hyper::server::{Handler, Request, Response};
use hyper::status::StatusCode::{NotFound, Unauthorized};
use hyper::uri::RequestUri::AbsolutePath;
use rustc_serialize::json;
use rustc_serialize::json::Json;
use url::form_urlencoded;

const API_ENDPOINT: &'static str = "https://www.cloudflare.com/api_json.html";

const INDEX_HTML: &'static str = include_str!("../../index.html");
const BUNDLE_JS: &'static str = include_str!("../../assets/bundle.js");

pub struct SiteHandler {
    cfg: Config,
    client: Client
}

impl SiteHandler {
    fn post(&self, body: &str) -> client::Response {
        let mut headers = Headers::new();
        headers.set(ContentType::form_url_encoded());
        self.client
            .post(API_ENDPOINT)
            .headers(headers)
            .body(body)
            .send()
            .unwrap()
    }
}

pub fn new(cfg: Config) -> SiteHandler {
    SiteHandler {
        cfg: cfg,
        client: Client::new()
    }
}

fn get_param<'a>(params: &'a Vec<(String, String)>, key: &str) -> &'a str {
    params.into_iter().find(|tuple| tuple.0 == key).map(|tuple| tuple.1.as_ref()).unwrap_or("")
}

fn serve(mut res: Response, content: &str, mime: Mime) {
    res.headers_mut().set(ContentType(mime));
    res.send(content.as_bytes()).unwrap();
}

impl Handler for SiteHandler {
    fn handle(&self, mut req: Request, mut res: Response) {
        let mut text = String::new();
        req.read_to_string(&mut text).ok().expect("Failed to get request body");
        match req.uri {
            AbsolutePath(ref path) => match (&req.method, &path[..]) {
                (&Get, "/") =>
                    serve(res, INDEX_HTML, mime!(Text/Html; Charset=Utf8)),
                (&Get, "/assets/bundle.js") =>
                    serve(res, BUNDLE_JS, mime!(Application/Javascript; Charset=Utf8)),
                (&Post, "/api") => {
                    let mut params = form_urlencoded::parse(text.as_bytes());
                    params.push(("email".to_string(), self.cfg.email.clone()));
                    params.push(("tkn".to_string(), self.cfg.token.clone()));

                    let a = get_param(&params, "a");
                    let z = get_param(&params, "z");
                    let whitelist = &self.cfg.whitelist;
                    let valid = whitelist.into_iter().any(|domain| domain == z);
                    if a == "zone_load_multi" {
                        let form_data = form_urlencoded::serialize(&params);
                        let mut proxy_res = self.post(&form_data);
                        let mut body = Json::from_reader(&mut proxy_res).unwrap();
                        {
                            let root = body.as_object_mut().unwrap();
                            let response = root.get_mut("response")
                                .unwrap()
                                .as_object_mut()
                                .unwrap();
                            let zones = response.get_mut("zones")
                                .unwrap()
                                .as_object_mut()
                                .unwrap();
                            let count = {
                                let objs = zones.get_mut("objs")
                                    .unwrap()
                                    .as_array_mut()
                                    .unwrap();
                                objs.retain(|zone| {
                                    let zone_name = zone.find("zone_name").and_then(|name| name.as_string()).unwrap();
                                    whitelist.into_iter().any(|domain| domain == zone_name)
                                });
                                objs.len()
                            };
                            zones.insert("count".to_string(), Json::U64(count as u64));
                        };

                        res.headers_mut().extend(proxy_res.headers.iter());
                        res.send(json::encode(&body).unwrap().as_bytes()).unwrap();
                    }
                    else if valid {
                        let form_data = form_urlencoded::serialize(&params);
                        let mut proxy_res = self.post(&form_data);
                        res.headers_mut().extend(proxy_res.headers.iter());
                        let mut res = res.start().unwrap();
                        io::copy(&mut proxy_res, &mut res).ok().expect("Failed to proxy");
                        res.end().unwrap();
                    }
                    else {
                        *res.status_mut() = Unauthorized;
                        res.send(b"Unauthorized").unwrap();
                    }
                },
                (&Get, _) =>
                    serve(res, INDEX_HTML, mime!(Text/Html; Charset=Utf8)),
                _ => {
                    *res.status_mut() = NotFound;
                    res.send(b"Not Found").unwrap();
                }
            },
            _ => {
                *res.status_mut() = NotFound;
                res.send(b"Not Found").unwrap();
            }
        }
    }
}
