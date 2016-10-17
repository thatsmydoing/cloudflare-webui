var DomainStore = require('../stores').Domains;
var React = require('react');
var dateToString = require('../util').dateToString;

var DevModeToggle = React.createClass({
  getInitialState: function() {
    return {toggling: false};
  },
  componentWillReceiveProps: function() {
    this.setState({toggling: false});
  },
  toggleDevMode: function() {
    this.setState({toggling: true});
    var newValue = this.props.setting.timestamp * 1000 <= Date.now();
    DomainStore.settingChange(this.props.domain, 'development_mode', newValue ? 'on' : 'off');
  },
  render: function() {
    var active = this.props.setting.timestamp * 1000 > Date.now();
    if(this.state.toggling) {
      return <button className="btn btn-warning" disabled>{active ? 'Disabling...' : 'Enabling...'}</button>
    }
    else if(active) {
      var date = new Date(this.props.setting.timestamp*1000);
      return (
        <div>
          <button className='btn btn-success' onClick={this.toggleDevMode}>On</button>
          <span> Active until {dateToString(date)}</span>
        </div>
      );
    }
    else {
      return <button className='btn btn-default' onClick={this.toggleDevMode}>Off</button>
    }
  }
});

var SSLToggle = React.createClass({
  options: [
    {value: 'off', name: 'Off'},
    {value: 'flexible', name: 'Flexible'},
    {value: 'full', name: 'Full'},
    {value: 'full_strict', name: 'Full (Strict)'}
  ],
  getInitialState: function() {
    return {toggling: false};
  },
  componentWillReceiveProps: function() {
    this.setState({toggling: false});
  },
  setSSLMode: function(event) {
    this.setState({toggling: true});
    var unToggle = function() {
      this.setState({toggling: false});
    }.bind(this);
    DomainStore.settingChange(this.props.domain, 'ssl', event.target.value).then(unToggle, unToggle);
  },
  render: function() {
    var options = this.options.map(function(opt) {
      return <option key={opt.value} value={opt.value}>{opt.name}</option>
    });
    var updating = <option>Updating...</option>
    return (
      <select
        className="form-control ssl"
        disabled={this.state.toggling}
        onChange={this.setSSLMode}
        value={this.props.setting.value}
      >
        {this.state.toggling ? updating : options}
      </select>
    )
  }
});

var PurgeButton = React.createClass({
  getInitialState: function() {
    return {purging: false, failed: false};
  },
  purgeCache: function() {
    var self = this;
    this.setState({purging: true});
    var reset = function() {
      this.setState({purging: false, failed: false});
    }.bind(this);
    DomainStore.purgeCache(this.props.domain).then(function(data) {
      setTimeout(reset, 5*1000);
    }, function(error) {
      self.setState({failed: true});
      setTimeout(reset, 10*1000);
    });
  },
  render: function() {
    if(this.state.failed) {
      return <button className="btn btn-danger" disabled>Purge failed</button>
    }
    else if(this.state.purging) {
      return <button className="btn btn-warning" disabled>Purging...</button>
    }
    else {
      return <button className="btn btn-success" onClick={this.purgeCache}>Purge</button>
    }
  }
});
var Settings = React.createClass({
  settingMap: {
    'development_mode': {
      title: 'Development Mode',
      component: DevModeToggle
    },
    'ssl': {
      title: 'SSL Mode',
      component: SSLToggle
    }
  },
  render: function() {
    if(this.props.settings.count() == 0) {
      return <div className="alert alert-info">Loading...</div>
    }

    var settings = this.props.settings.map(function(setting) {
      var opts = this.settingMap[setting.id.val()];
      if(opts != undefined) {
        return (
          <tr key={setting.id.val()}>
            <td>{opts.title}</td>
            <td><opts.component domain={this.props.domain} setting={setting.val()} /></td>
          </tr>
        )
      }
      return null;
    }.bind(this));

    return (
      <div>
        <table className="table">
          <tbody>
            <tr>
              <td>Purge Cache</td>
              <td><PurgeButton domain={this.props.domain} /></td>
            </tr>
            {settings}
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = Settings;
