# Cloudflare WebUI

This is a web frontend to the Cloudflare API. It mainly lets you manage DNS
records, but it also lets you toggle development mode and purge the cache as
well as changing the SSL mode.

It's a simple frontend for the DNS settings and a simple webserver that handles
making the actual requests to Cloudflare.

## Usage

Clone the repository, and copy `config.json.example` to `config.json`. Make an
API token with:

 * Zone - DNS - Edit
 * Zone - Zone Settings - Edit
 * Zone - Cache Purge - Purge

and update `config.json` with it. Then run `npm install` then `npm start`. You
should be able to manage your domains at `localhost:8000`.

## Security

The server only listens at 127.0.0.1. It does not provide any form of
authentication. It is meant to be run behind a reverse proxy such as nginx with
basic auth, or behind something like
[oauth2_proxy][3].

The server never exposes your API token to the clients, all requests to
Cloudflare are made from the server.

[1]: https://support.cloudflare.com/hc/en-us/articles/200167846-How-do-I-add-additional-users-to-my-CloudFlare-account-
[2]: https://github.com/thatsmydoing/cloudflare-webui/releases
[3]: https://github.com/bitly/oauth2_proxy
