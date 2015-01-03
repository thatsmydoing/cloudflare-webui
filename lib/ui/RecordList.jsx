var DomainStore = require('../stores').Domains;
var React = require('react');

var CloudActive = React.createClass({
  render: function() {
    var record = this.props.record;
    var type = record.type.val();
    if(type === 'A' || type === 'AAAA' || type === 'CNAME') {
      var active = record.service_mode.val() === '1';
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
  types: ['A', 'AAAA', 'CNAME'],
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
      content: this.refs.value.getDOMNode().value.trim()
    };
    this.finishSave(DomainStore.add(this.props.domain, newRecord));
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
    DomainStore.remove(record.zone_name.val(), record.rec_id.val());
  },
  commitEdit: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.rec_id.val(),
      type: record.type.val(),
      name: this.refs.name.getDOMNode().value.trim(),
      content: this.refs.value.getDOMNode().value.trim()
    };
    if(record.service_mode.val()) {
      newRecord.service_mode = record.service_mode.val();
    }
    DomainStore.edit(record.zone_name.val(), newRecord);
  },
  toggleProxy: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.rec_id.val(),
      type: record.type.val(),
      name: record.name.val(),
      content: record.content.val(),
      service_mode: record.service_mode.val() === "1" ? "0" : "1"
    };
    DomainStore.edit(record.zone_name.val(), newRecord);
  },
  render: function() {
    var record = this.props.record;
    var className = this.state.saving ? 'saving' : '';
    var editDisabled = ['MX', 'SRV'].indexOf(record.type.val()) >= 0;
    if(this.state.state === 'edit') {
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type.val()}>{record.type.val()}</span></td>
          <td><input type="text" ref="name" defaultValue={record.display_name.val()} /></td>
          <td><input type="text" ref="value" defaultValue={record.display_content.val()} /></td>
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
          <td><strong>{record.display_name.val()}</strong></td>
          <td>{record.display_content.val()}</td>
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
          <td><strong>{record.display_name.val()}</strong></td>
          <td className="value">{record.display_content.val()}</td>
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
      return <Record key={record.rec_id.val()} record={record} />
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
