var React = require('react');

var Domain = React.createClass({
  render: function() {
    var className = this.props.active ? 'active' : '';
    return (
      <li role="presentation" className={className}>
        <a href={'/'+this.props.data.name.val()}>{this.props.data.name.val()}</a>
      </li>
    );
  }
});

var DomainList = React.createClass({
  render: function() {
    var currDomain = this.props.currentDomain;
    var domains = this.props.domains.map(function(domain) {
      var active = currDomain === domain.name.val();
      return <Domain key={domain.id.val()} data={domain} active={active} />
    });

    return (
      <div>
        <h1>Domains</h1>
        { domains.length === 0 &&
          <div className="alert alert-info">Loading...</div>
        }

        { domains.length > 0 &&
          <ul className="nav nav-pills nav-stacked">
            {domains}
          </ul>
        }
      </div>
    );
  }
});

module.exports = DomainList;
