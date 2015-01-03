var cloudflare = require('../cloudflare');
var React = require('react');

var Domain = React.createClass({
  render: function() {
    var className = this.props.active ? 'active' : '';
    return (
      <li role="presentation" className={className}>
        <a href={'/'+this.props.data.zone_name}>{this.props.data.zone_name}</a>
      </li>
    );
  }
});

var DomainList = React.createClass({
  getInitialState: function() {
    return {domains: []};
  },
  componentDidMount: function() {
    cloudflare.domains().then(function(data) {
      this.setState({domains: data.response.zones.objs});
    }.bind(this));
  },
  render: function() {
    var currDomain = this.props.currentDomain;
    var domains = this.state.domains.map(function(domain) {
      var active = currDomain === domain.zone_name;
      return <Domain key={domain.zone_id} data={domain} active={active} />
    });
    return (
      <div>
        <h1>Domains</h1>
        <ul className="nav nav-pills nav-stacked">
          {domains}
        </ul>
      </div>
    );
  }
});

module.exports = DomainList;
