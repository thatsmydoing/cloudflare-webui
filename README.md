# Cloudflare WebUI

This is a web frontend to the Cloudflare API. It mainly lets you manage DNS
records, but it also lets you toggle development mode and purge the cache.

This was mainly built to work around Cloudflare only having [multi-user support
for enterprise][1]. It's a simple frontend for the DNS settings and a simple
webserver that handles making the actual requests to Cloudflare.

## Usage

After cloning the repository, copy `config.json.example` to `config.json` and
fill it with your account details and put the domains you want to manage in the
`whitelist` array. Afterwards, run `npm install` then `npm start` and you should
be able to manage your domains in `localhost:8000`.

## Security

The server does not provide any form of authentication. It is meant to be run
behind a reverse proxy such as nginx with basic auth, or behind something like
[oauth2_proxy][2].

The server never exposes your username and token to the clients, all requests to
Cloudflare are made from the server. The server will also only allow API
requests to domains specified in the whitelist. Domains not listed will be
blocked even if your account owns it.

[1]: https://support.cloudflare.com/hc/en-us/articles/200167846-How-do-I-add-additional-users-to-my-CloudFlare-account-
[2]: https://github.com/bitly/oauth2_proxy
