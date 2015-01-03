var cloudflare = require('../cloudflare');
var React = require('react');

var CloudActive = React.createClass({
  render: function() {
    var record = this.props.record;
    if(record.type === 'A' || record.type === 'AAAA' || record.type === 'CNAME') {
      var active = record.service_mode === '1';
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
    promise.then(this.props.onEdit).then(function() {
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
    this.finishSave(cloudflare.record_add(this.props.domain, newRecord));
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
  setDeleting: function() {
    this.setState({state: 'delete'});
  },
  setEditing: function() {
    this.setState({state: 'edit'});
  },
  cancelEdit: function() {
    this.setState({state: 'view'});
  },
  finishSave: function(promise) {
    promise.then(this.props.onEdit).then(function() {
      this.setState({state: 'view', saving: false});
    }.bind(this));
  },
  commitDelete: function() {
    this.setState({saving: true});
    var record = this.props.record;
    this.finishSave(cloudflare.record_delete(record.zone_name, record.rec_id));
  },
  commitEdit: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.rec_id,
      type: record.type,
      name: this.refs.name.getDOMNode().value.trim(),
      content: this.refs.value.getDOMNode().value.trim()
    };
    if(record.service_mode) {
      newRecord.service_mode = record.service_mode;
    }
    this.finishSave(cloudflare.record_edit(record.zone_name, newRecord));
  },
  toggleProxy: function() {
    this.setState({saving: true});
    var record = this.props.record;
    var newRecord = {
      id: record.rec_id,
      type: record.type,
      name: record.name,
      content: record.content,
      service_mode: record.service_mode === "1" ? "0" : "1"
    };
    this.finishSave(cloudflare.record_edit(record.zone_name, newRecord));
  },
  render: function() {
    var record = this.props.record;
    var className = this.state.saving ? 'saving' : '';
    if(this.state.state === 'edit') {
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type}>{record.type}</span></td>
          <td><input type="text" ref="name" defaultValue={record.display_name} /></td>
          <td><input type="text" ref="value" defaultValue={record.display_content} /></td>
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
          <td className="record-type"><span className={record.type}>{record.type}</span></td>
          <td><strong>{record.display_name}</strong></td>
          <td>{record.display_content}</td>
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
          <td className="record-type"><span className={record.type}>{record.type}</span></td>
          <td><strong>{record.display_name}</strong></td>
          <td className="value">{record.display_content}</td>
          <td><CloudActive record={record} onClick={this.toggleProxy} /></td>
          <td className="actions">
            <button className="btn btn-primary" onClick={this.setEditing}>Edit</button>
            <span> </span>
            <button className="btn btn-danger" onClick={this.setDeleting}>Delete</button>
          </td>
        </tr>
      );
    }
  }
});
var RecordList = React.createClass({
  getInitialState: function() {
    return {records: []};
  },
  componentDidMount: function() {
    this.reload();
  },
  componentWillReceiveProps: function(nextProps) {
    if(nextProps.domain != this.props.domain) {
      this.setState({records: []});
      this.reload(nextProps);
    }
  },
  reload: function(props) {
    if(!props) {
      props = this.props;
    }
    return cloudflare.records(props.domain).then(function(data) {
      this.setState({records: data.response.recs.objs});
    }.bind(this));
  },
  render: function() {
    var records = this.state.records.map(function(record) {
      return <Record key={record.rec_id} record={record} onEdit={this.reload} />
    }.bind(this));
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
          <tbody>
            <RecordCreate domain={this.props.domain} onEdit={this.reload} />
            {records}
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = RecordList;
