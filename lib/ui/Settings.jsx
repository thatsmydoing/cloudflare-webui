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
    DomainStore.setDevelopmentMode(this.props.domain, this.props.devMode * 1000 <= Date.now());
  },
  render: function() {
    var active = this.props.devMode * 1000 > Date.now();
    if(this.state.toggling) {
      return <button className="btn btn-warning" disabled>{active ? 'Disabling...' : 'Enabling...'}</button>
    }
    else if(active) {
      var date = new Date(this.props.devMode*1000);
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
  render: function() {
    if(!this.props.settings.val()) {
      return <div className="alert alert-info">Loading...</div>
    }

    return (
      <div>
        <table className="table">
          <tr>
            <td>Development Mode</td>
            <td><DevModeToggle domain={this.props.domain} devMode={this.props.settings.development_mode.val()} /></td>
          </tr>
          <tr>
            <td>Purge Cache</td>
            <td><PurgeButton domain={this.props.domain} /></td>
          </tr>
        </table>
      </div>
    );
  }
});

module.exports = Settings;
