# UNMAINTAINED

This project is no longer maintained. Cloudflare already supports [multi-user
for any account][4] so there's not much need for this project anymore.

If you still absolutely need this for the whitelist functionality, you can try
the [api-token branch][5].

# Cloudflare WebUI

This is a web frontend to the Cloudflare API. It mainly lets you manage DNS
records, but it also lets you toggle development mode and purge the cache as
well as changing the SSL mode.

This was mainly built to work around Cloudflare only having [multi-user support
for enterprise][1]. It's a simple frontend for the DNS settings and a simple
webserver that handles making the actual requests to Cloudflare.

## Usage

Download the [binary][2] (only Linux x86_64 for now). Get a copy of
`config.json.example` and name it `config.json`. Place it in the same directory
as the binary. Fill in your account details and the domains to be whitelisted.
Afterwards, run the binary and you should be able to manage your domains at
`localhost:8000`.

## Security

The server only listens at 127.0.0.1. It does not provide any form of
authentication. It is meant to be run behind a reverse proxy such as nginx with
basic auth, or behind something like
[oauth2_proxy][3].

The server never exposes your username and token to the clients, all requests to
Cloudflare are made from the server. The server will also only allow API
requests to domains specified in the whitelist. Domains not listed will be
blocked even if your account owns it.

[1]: https://support.cloudflare.com/hc/en-us/articles/200167846-How-do-I-add-additional-users-to-my-CloudFlare-account-
[2]: https://github.com/thatsmydoing/cloudflare-webui/releases
[3]: https://github.com/bitly/oauth2_proxy
[4]: https://support.cloudflare.com/hc/en-us/articles/205065067-Setting-up-Multi-User-accounts-on-Cloudflare
[5]: https://github.com/thatsmydoing/cloudflare-webui/tree/api-token
