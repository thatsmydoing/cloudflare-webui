var DomainStore = require('./stores').Domains;
var React = require('react');
var ReactMiniRouter = require('react-mini-router');

var DomainList = require('./ui/DomainList');
var RecordList = require('./ui/RecordList');
var Settings = require('./ui/Settings');

var App = React.createClass({
  mixins: [ReactMiniRouter.RouterMixin],
  routes: {
    '/': 'home',
    '/:domain': 'domain',
    '/:domain/settings': 'settings'
  },
  render: function() {
    return this.renderCurrentRoute();
  },
  main: function(domain, settings) {
    var title;
    var content = [];
    if(domain) {
      title = domain;
      content.push(
        <ul key="nav" className="nav nav-tabs">
          <li role="presentation" className={!settings ? 'active' : ''}><a href={'/'+domain}>DNS</a></li>
          <li role="presentation" className={settings ? 'active' : ''}><a href={'/'+domain+'/settings'}>Settings</a></li>
        </ul>
      );

      var store = DomainStore.find(domain);
      if(store) {
        if(settings) {
          content.push(<Settings key="settings" domain={domain} settings={store} />);
        }
        else {
          DomainStore.loadRecords(domain);
          content.push(<RecordList key="records" domain={domain} records={store.records} />);
        }
      }

    }
    else {
      title = "CloudFlare WebUI";
      content.push(<p key="content">Select a domain from the sidebar</p>);
    }

    return (
      <div className="row">
        <div id="domains" className="col-md-3">
          <DomainList currentDomain={domain} domains={this.props.domains} />
        </div>
        <div className="col-md-9">
          <h1>{title}</h1>
          {content}
        </div>
      </div>
    );
  },
  home: function() {
    return this.main();
  },
  domain: function(domain) {
    return this.main(domain, false);
  },
  settings: function(domain) {
    return this.main(domain, true);
  }
});

module.exports = App;
