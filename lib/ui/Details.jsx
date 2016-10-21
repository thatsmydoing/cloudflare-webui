var React = require('react');
var dateToString = require('../util').dateToString;

var empty = <i>none</i>;

var DetailEntry = React.createClass({
  render: function() {
    return (
      <tr>
        <td>{this.props.name}</td>
        <td>{this.props.children || empty}</td>
      </tr>
    )
  }
});

function join(arr) {
  if(arr) {
    return arr.join(', ');
  }
}

var Details = React.createClass({
  render: function() {
    var details = this.props.details.val();
    return (
      <div>
        <table className="table">
          <tbody>
            <DetailEntry name="Plan">
              {details.plan.name} ({details.plan.price} {details.plan.currency})
            </DetailEntry>
            <DetailEntry name="Type">
              {details.type}
            </DetailEntry>
            <DetailEntry name="Status">
              {details.status}
            </DetailEntry>
            <DetailEntry name="Created on">
              {dateToString(new Date(details.created_on))}
            </DetailEntry>
            <DetailEntry name="Modified on">
              {dateToString(new Date(details.modified_on))}
            </DetailEntry>
            <DetailEntry name="Nameservers">
              {join(details.name_servers)}
            </DetailEntry>
            <DetailEntry name="Original Nameservers">
              {join(details.original_name_servers)}
            </DetailEntry>
            <DetailEntry name="Original DNS Host">
              {details.original_dnshost}
            </DetailEntry>
            <DetailEntry name="Original Registrar">
              {details.original_registrar}
            </DetailEntry>
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = Details;
