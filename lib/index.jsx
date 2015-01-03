require("bootstrap/dist/css/bootstrap.css");
require("../main.css");

var React = require('react');
var App = require('./App');

var DomainStore = require('./stores').Domains;

var AppComponent = React.render(
  <App history={true} domains={DomainStore.cortex} />,
  document.getElementById('content')
);

DomainStore.cortex.on('update', function(newStore) {
  AppComponent.setProps({domains: newStore});
});
