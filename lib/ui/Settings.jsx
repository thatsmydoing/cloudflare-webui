var cloudflare = require('../cloudflare');
var React = require('react');

var DevModeToggle = React.createClass({
  render: function() {
    if(this.props.devMode > 0) {
      var date = new Date(this.props.devMode*1000);
      var dateString = date.getFullYear()+'/'+(1+date.getMonth())+'/'+date.getDay()+' '+date.getHours()+':'+date.getMinutes();
      return (
        <div>
          <button className='btn btn-success' onClick={this.props.onClick}>On</button>
          <span> Active until {dateString}</span>
        </div>
      );
    }
    else {
      return <button className='btn btn-default' onClick={this.props.onClick}>Off</button>
    }
  }
});
var PurgeButton = React.createClass({
  getInitialState: function() {
    return {purging: false};
  },
  purgeCache: function() {
    this.setState({purging: true});
    var reset = function() {
      this.setState({purging: false});
    }.bind(this);
    cloudflare.purge_cache(this.props.domain).then(function(data) {
      var timeout = data.attributes.cooldown;
      setTimeout(reset, timeout*1000);
    });
  },
  render: function() {
    if(this.state.purging) {
      return <button className="btn btn-warning" disabled>Purging...</button>
    }
    else {
      return <button className="btn btn-success" onClick={this.purgeCache}>Purge</button>
    }
  }
});
var Settings = React.createClass({
  getInitialState: function() {
    return {settings: {}};
  },
  componentDidMount: function() {
    this.reload();
  },
  reload: function() {
    return cloudflare.settings(this.props.domain).then(function(data) {
      this.setState({settings: data.response.result.objs[0]});
    }.bind(this));
  },
  toggleDevMode: function() {
    cloudflare.set_devmode(this.props.domain, this.state.settings.dev_mode == 0).then(this.reload);
  },
  render: function() {
    return (
      <div>
        <table className="table">
          <tr>
            <td>Development Mode</td>
            <td><DevModeToggle devMode={this.state.settings.dev_mode} onClick={this.toggleDevMode} /></td>
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
