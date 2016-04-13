var fs = require('fs');
var request = require('request');
var connect = require('connect');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var config = require('./config.json');

var apiEndpoint = 'https://www.cloudflare.com/api_json.html';
var isProd = config.isProd === undefined || config.isProd;
var port = config.port || 8000;

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

app.use(bodyParser.urlencoded({extended: false}));
app.use(function(req, res, next) {
    if(req.url === '/api') {
        req.body.email = config.email;
        req.body.tkn = config.token;

        // filter out only zones in the whitelist
        if(req.body.a === 'zone_load_multi') {
            request.post({uri: apiEndpoint, form: req.body, json: true}, function(err, inc, body) {
                var filtered = body.response.zones.objs.filter(function(zone) {
                    return config.whitelist.indexOf(zone.zone_name) >= 0;
                });
                body.response.zones.objs = filtered;
                body.response.zones.count = filtered.length;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
            });
        }

        // allow any requests for zones in whitelist
        else if(config.whitelist.indexOf(req.body.z) >= 0) {
            request.post(apiEndpoint).form(req.body).pipe(res);
        }

        // deny otherwise
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
