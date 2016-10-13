var fs = require('fs');
var request = require('request');
var connect = require('connect');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var config = require('./config.json');

var apiEndpoint = 'https://api.cloudflare.com/client/v4';
var isProd = config.isProd === undefined || config.isProd;
var port = config.port || 8000;
var identifierWhitelist = null;

var app = connect();
var serve = serveStatic('.', {'index': []});
var serveIndex = function(req, res, next) {
    if(isProd) {
        req.url = '/index.html';
        serve(req, res, next);
    }
    else {
        var html = fs.readFileSync('./index.html', {encoding: 'utf8'});
        res.setHeader('Content-Type', 'text/html; charset=utf8');
        res.end(html.replace('/assets/bundle.js', 'http://localhost:8001/assets/bundle.js'));
    }
};

app.use(bodyParser.json());
app.use(function(req, res, next) {
    if(req.url.startsWith('/api')) {
        var headers = {
            'X-Auth-Email': config.email,
            'X-Auth-Key': config.token
        }

        var path = req.url.substring(4);

        // filter out only zones in the whitelist
        if(path === '/zones') {
            request.get({uri: apiEndpoint+path, headers: headers, json: true}, function(err, inc, body) {
                var filtered = body.result.filter(function(zone) {
                    return config.whitelist.indexOf(zone.name) >= 0;
                });
                // TODO prefetch entire zone list
                if(identifierWhitelist === null) {
                    identifierWhitelist = filtered.map(function(zone) {
                        return zone.id;
                    });
                }
                body.result = filtered;
                body.result_info.count = filtered.length;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
            });
        }

        else if(path.startsWith('/zones')) {
            // allow any requests for zones in whitelist
            var identifier = path.replace(/^\/zones\/([0-9a-f]+).*$/, "$1");
            if(identifierWhitelist.indexOf(identifier) >= 0) {
                request({
                    method: req.method,
                    uri: apiEndpoint+path,
                    headers: headers,
                    qs: req.method == 'GET' ? {per_page: 999} : {},
                    body: req.body,
                    json: true
                }).pipe(res);
            }
            else {
                // deny otherwise
                next();
            }
        }

        // deny other request paths for now
        else {
            next();
        }
    }
    else {
        next();
    }
});
app.use(serve);
app.use(serveIndex);

if(!isProd) {
    var WebpackDevServer = require('webpack-dev-server');
    var HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

    var webpack = require('webpack');
    var webpackConfig = require('./webpack.config.js');
    webpackConfig.entry = [
        "webpack-dev-server/client?http://localhost:8001",
        "webpack/hot/dev-server",
        webpackConfig.entry
    ];
    webpackConfig.output.path = '/';
    webpackConfig.output.publicPath = 'http://localhost:8001/assets/';
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins.push(new HotModuleReplacementPlugin());
    webpackConfig.devtool = 'eval';

    var devServer = new WebpackDevServer(webpack(webpackConfig), {
        contentBase: 'http://localhost:8000',
        publicPath: webpackConfig.output.publicPath,
        hot: true
    })
    devServer.listen(8001);
}
app.listen(port);
