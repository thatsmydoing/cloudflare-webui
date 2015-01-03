require("bootstrap/dist/css/bootstrap.css");
require("../main.css");

var React = require('react');
var App = require('./App');

React.render(
  <App history={true} />,
  document.getElementById('content')
);

