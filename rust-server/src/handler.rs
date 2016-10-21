use config::Config;
use mime::Mime;
use std::io;
use std::collections::HashSet;
use hyper::Get;
use hyper::Client;
use hyper::client;
use hyper::header::{ContentType, ETag, EntityTag, IfNoneMatch, Headers};
use hyper::method::Method;
use hyper::server::{Handler, Request, Response};
use hyper::status::StatusCode::{InternalServerError, NotFound, NotModified, Unauthorized};
use hyper::uri::RequestUri::AbsolutePath;
use hyper::Url;
use rustc_serialize::json;
use rustc_serialize::json::Json;
use sha1::Sha1;

const API_ENDPOINT: &'static str = "https://api.cloudflare.com/client/v4";

const INDEX_HTML: &'static str = include_str!("../../index.html");
const BUNDLE_JS: &'static str = include_str!("../../assets/bundle.js");

struct Etags {
    index: EntityTag,
    bundle: EntityTag
}

pub struct SiteHandler {
    cfg: Config,
    client: Client,
    etags: Etags,
    whitelist: HashSet<String>
}

impl SiteHandler {
    fn make_headers(&self) -> Headers {
        let mut headers = Headers::new();
        headers.set_raw("x-auth-email", vec![self.cfg.email.as_bytes().to_vec()]);
        headers.set_raw("x-auth-key", vec![self.cfg.token.as_bytes().to_vec()]);
        headers.set(ContentType::json());
        headers
    }

    fn request(&self, method: Method, url: &str, mut body: Option<Request>) -> client::Response {
        let url = API_ENDPOINT.to_owned() + url;
        let mut url = Url::parse(&url).unwrap();
        if method == Get {
            url.query_pairs_mut().append_pair("per_page", "999");
        }
        let request = self.client.request(method, url).headers(self.make_headers());
        let request = match body.as_mut() {
            Some(body) => request.body(body),
            None => request
        };
        request.send().unwrap()
    }

    fn has_whitelist(&self) -> bool {
        self.cfg.whitelist.is_some()
    }

    fn is_valid(&self, path: &str) -> bool {
        if self.has_whitelist() {
            let zone: String = path.chars()
                .skip(1)
                .skip_while(|c| *c != '/')
                .skip(1)
                .take_while(|c| *c != '/')
                .collect();
            self.whitelist.contains(&zone)
        }
        else {
            true
        }
    }
}

fn make_etag(source: &str) -> EntityTag {
    let mut m = Sha1::new();
    m.update(source.as_bytes());
    let digest = m.digest().to_string();
    EntityTag::new(false, digest)
}

pub fn new(cfg: Config) -> SiteHandler {
    let mut handler = SiteHandler {
        cfg: cfg,
        client: Client::new(),
        etags: Etags {
            index: make_etag(INDEX_HTML),
            bundle: make_etag(BUNDLE_JS)
        },
        whitelist: HashSet::new()
    };
    let mut response = handler.request(Get, "/zones", None);
    if let Some(ref domain_whitelist) = handler.cfg.whitelist {
        let mut whitelist: HashSet<String> = HashSet::new();
        match Json::from_reader(&mut response) {
            Ok(body) => {
                let zones = body.find("result").and_then(|result| result.as_array()).unwrap();
                for zone in zones {
                    let id = zone.find("id").and_then(|id| id.as_string()).unwrap();
                    let name = zone.find("name").and_then(Json::as_string).unwrap();
                    if domain_whitelist.into_iter().any(|domain| domain == name) {
                        whitelist.insert(id.to_owned());
                    }
                }
            },
            Err(error) => {
                println!("Error: {}", error);
            }
        }
        handler.whitelist = whitelist;
    }
    handler
}

fn serve(req: &Request, mut res: Response, content: &str, etag: &EntityTag, mime: Mime) {
    let empty_vec = vec!();
    let etags = req.headers.get::<IfNoneMatch>();
    let etags: &Vec<EntityTag> = match etags {
        Some(&IfNoneMatch::Items(ref items)) => items,
        _ => &empty_vec
    };
    let is_cached = etags.iter().find(|&etag_b| etag.weak_eq(etag_b)).is_some();

    res.headers_mut().set(ContentType(mime));
    res.headers_mut().set(ETag(etag.to_owned()));
    if is_cached {
        *res.status_mut() = NotModified;
    }
    else {
        res.send(content.as_bytes()).unwrap();
    }
}

impl Handler for SiteHandler {
    fn handle(&self, req: Request, mut res: Response) {
        let uri = req.uri.clone();
        let method = req.method.clone();
        match uri {
            AbsolutePath(ref path) => match (&method, &path[..]) {
                (&Get, "/") =>
                    serve(&req, res, INDEX_HTML, &self.etags.index, mime!(Text/Html; Charset=Utf8)),
                (&Get, "/assets/bundle.js") =>
                    serve(&req, res, BUNDLE_JS, &self.etags.bundle, mime!(Application/Javascript; Charset=Utf8)),
                (method, url) if path.starts_with("/api") => {
                    let method = method.clone();
                    let path: String = url.chars().skip(4).collect();

                    let whitelist = &self.whitelist;
                    if path == "/zones" {
                        let mut proxy_res = self.request(method, &path, None);
                        if self.has_whitelist() {
                            match Json::from_reader(&mut proxy_res) {
                                Ok(mut body) => {
                                    // filter out non-whitelisted domains
                                    body.as_object_mut()
                                        .and_then(|mut root| root.get_mut("result"))
                                        .and_then(|mut result| result.as_array_mut())
                                        .map(|mut zones| {
                                            zones.retain(|zone| {
                                                let id = zone.find("id").and_then(|id| id.as_string()).unwrap();
                                                whitelist.contains(id)
                                            });
                                        });

                                    let json = json::encode(&body).unwrap();
                                    res.headers_mut().set(ContentType(mime!(Application/Json; Charset=Utf8)));
                                    res.send(json.as_bytes()).unwrap();
                                },
                                Err(error) => {
                                    println!("Error: {}", error);
                                    *res.status_mut() = InternalServerError;
                                    res.send(b"Unexpected response from CloudFlare").unwrap();
                                }
                            };
                        }
                        else {
                            res.headers_mut().set(ContentType(mime!(Application/Json; Charset=Utf8)));
                            let mut res = res.start().unwrap();
                            io::copy(&mut proxy_res, &mut res).ok().expect("Failed to proxy");
                            res.end().unwrap();
                        }
                    }
                    else if self.is_valid(&path) {
                        let mut proxy_res = self.request(method, &path, Some(req));
                        res.headers_mut().set(ContentType(mime!(Application/Json; Charset=Utf8)));
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
                    serve(&req, res, INDEX_HTML, &self.etags.index, mime!(Text/Html; Charset=Utf8)),
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
