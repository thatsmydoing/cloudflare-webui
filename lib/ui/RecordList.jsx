var DomainStore = require('../stores').Domains;
var React = require('react');

var CloudActive = React.createClass({
  render: function() {
    var record = this.props.record;
    if(record.proxiable.val()) {
      var active = record.proxied.val();
      if(active) {
        return <button className='btn btn-warning' onClick={this.props.onClick}>On</button>
      }
      else {
        return <button className='btn btn-default' onClick={this.props.onClick}>Off</button>
      }
    }
    else {
      return <span></span>;
    }
  }
});
var RecordCreate = React.createClass({
  getInitialState: function() {
    return {saving: false};
  },
  types: ['A', 'AAAA', 'CNAME', 'LOC', 'NS', 'SPF', 'TXT'],
  finishSave: function(promise) {
    promise.then(function() {
      this.setState({saving: false});
      this.reset();
    }.bind(this));
  },
  reset: function() {
    this.refs.type.getDOMNode().value = this.types[0];
    this.refs.name.getDOMNode().value = "";
    this.refs.value.getDOMNode().value = "";
  },
  commitAdd: function() {
    this.setState({saving: true});
    var newRecord = {
      type: this.refs.type.getDOMNode().value,
      name: this.refs.name.getDOMNode().value.trim(),
      content: this.refs.value.getDOMNode().value.trim(),
      ttl: 1 // automatic
    };
    this.finishSave(DomainStore.recordAdd(this.props.domain, newRecord));
  },
  render: function() {
    var className = this.state.saving ? 'saving' : '';
    var options = this.types.map(function(type) {
      return <option key={type} value={type}>{type}</option>
    });
    return (
      <tr className={className}>
        <td>
          <select ref="type">
            {options}
          </select>
        </td>
        <td><input type="text" ref="name" /></td>
        <td><input type="text" ref="value" /></td>
        <td></td>
        <td>
          <button className="btn btn-success" onClick={this.commitAdd}>Add</button>
        </td>
      </tr>
    )
  }
});
var Record = React.createClass({
  getInitialState: function() {
    return {state: 'view', saving: false};
  },
  componentWillReceiveProps: function() {
    this.setState({state: 'view', saving: false});
  },
  setDeleting: function() {
    this.setState({state: 'delete'});
  },
  setEditing: function() {
    this.setState({state: 'edit'});
  },
  cancelEdit: function() {
    this.setState({state: 'view'});
  },
  commitDelete: function() {
    this.setState({saving: true});
    var record = this.props.record;
    DomainStore.recordDelete(record.zone_name.val(), record.id.val());
  },
  commitEdit: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.id.val(),
      type: record.type.val(),
      name: this.refs.name.getDOMNode().value.trim(),
      content: this.refs.value.getDOMNode().value.trim(),
      ttl: 1 // automatic
    };
    if(record.proxied.val()) {
      newRecord.proxied = record.proxied.val();
    }
    DomainStore.recordEdit(record.zone_name.val(), newRecord);
  },
  toggleProxy: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.id.val(),
      type: record.type.val(),
      name: record.name.val(),
      content: record.content.val(),
      proxied: !record.proxied.val(),
      ttl: 1
    };
    DomainStore.recordEdit(record.zone_name.val(), newRecord);
  },
  render: function() {
    var record = this.props.record;
    var className = this.state.saving ? 'saving' : '';
    var editDisabled = ['MX', 'SRV'].indexOf(record.type.val()) >= 0;
    var displayName = record.name.val();
    var zoneName = '.'+record.zone_name.val();
    var limit = displayName.length - zoneName.length;
    if(limit > 0 && displayName.substring(limit) === zoneName) {
      displayName = displayName.substring(0, limit);
    }
    if(this.state.state === 'edit') {
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type.val()}>{record.type.val()}</span></td>
          <td><input type="text" ref="name" defaultValue={displayName} /></td>
          <td><input type="text" ref="value" defaultValue={record.content.val()} /></td>
          <td>
            <a onClick={this.cancelEdit}>Cancel</a>
          </td>
          <td>
            <button className="btn btn-success" onClick={this.commitEdit}>Save</button>
          </td>
        </tr>
      );
    }
    else if(this.state.state === 'delete') {
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type.val()}>{record.type.val()}</span></td>
          <td><strong>{displayName}</strong></td>
          <td>{record.content.val()}</td>
          <td>
            <a onClick={this.cancelEdit}>Cancel</a>
          </td>
          <td>
            <button className="btn btn-danger" onClick={this.commitDelete}>Delete</button>
          </td>
        </tr>
      );
    }
    else {
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type.val()}>{record.type.val()}</span></td>
          <td><strong>{displayName}</strong></td>
          <td className="value">{record.content.val()}</td>
          <td><CloudActive record={record} onClick={this.toggleProxy} /></td>
          <td className="actions">
            <button className="btn btn-primary" disabled={editDisabled} onClick={this.setEditing}>Edit</button>
            <span> </span>
            <button className="btn btn-danger" onClick={this.setDeleting}>Delete</button>
          </td>
        </tr>
      );
    }
  }
});
var RecordList = React.createClass({
  render: function() {
    var records = this.props.records.map(function(record) {
      return <Record key={record.id.val()} record={record} />
    }.bind(this));

    var body;
    if(records.length === 0) {
      body = (
        <tbody>
          <tr>
            <td colSpan="5">Loading...</td>
          </tr>
        </tbody>
      );
    }
    else {
      body = (
        <tbody>
          {records}
          <RecordCreate domain={this.props.domain} />
        </tbody>
      );
    }
    return (
      <div id="records">
        <table className="table">
          <thead>
            <tr>
              <th className="type">Type</th>
              <th className="name">Name</th>
              <th className="value">Value</th>
              <th className="proxy">Proxy</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          {body}
        </table>
      </div>
    );
  }
});

module.exports = RecordList;
