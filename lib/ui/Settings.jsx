var DomainStore = require('../stores').Domains;
var React = require('react');

var DevModeToggle = React.createClass({
  render: function() {
    if(this.props.devMode > 0) {
      var date = new Date(this.props.devMode*1000);
      var dateString = date.getFullYear()+'/'+(1+date.getMonth())+'/'+date.getDate()+' '+date.getHours()+':'+date.getMinutes();
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
    DomainStore.purgeCache(this.props.domain).then(function(data) {
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
  toggleDevMode: function() {
    DomainStore.setDevelopmentMode(this.props.domain, this.props.settings.dev_mode.val() == 0);
  },
  render: function() {
    if(!this.props.settings.val()) {
      return <div className="alert alert-info">Loading...</div>
    }

    return (
      <div>
        <table className="table">
          <tr>
            <td>Development Mode</td>
            <td><DevModeToggle devMode={this.props.settings.dev_mode.val()} onClick={this.toggleDevMode} /></td>
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
