var fs = require('fs');
var request = require('request');
var connect = require('connect');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var config = require('./config.json');

var apiEndpoint = 'https://api.cloudflare.com/client/v4';
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

app.use(bodyParser.json());
app.use(function(req, res, next) {
    if(req.url.startsWith('/api')) {
        var headers = {
            'Authorization': `Bearer ${config.token}`
        }

        var path = req.url.substring(4);

        if(path === '/zones') {
            var params = {uri: apiEndpoint+path, headers: headers, json: true};
            request.get(params).pipe(res);
        }

        else if(path.startsWith('/zones')) {
            request({
                method: req.method,
                uri: apiEndpoint+path,
                headers: headers,
                qs: req.method == 'GET' ? {per_page: 999} : {},
                body: req.body,
                json: true
            }).pipe(res);
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
