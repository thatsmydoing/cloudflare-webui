var DomainStore = require('../stores').Domains;
var React = require('react');
var deepMerge = require('../util').deepMerge;

var TextName = React.createClass({
  getName: function() {
    return {
      name: this.refs.name.getDOMNode().value.trim()
    }
  },
  clear: function() {
    this.refs.name.getDOMNode().value = "";
  },
  render: function() {
    return (
      <td><input type="text" ref="name" defaultValue={this.props.record.name} /></td>
    )
  }
});
var SRVName = React.createClass({
  getName: function() {
    return {
      data: {
        service: this.refs.service.getDOMNode().value.trim(),
        proto: this.refs.proto.getDOMNode().value
      }
    }
  },
  clear: function() {
    this.refs.service.getDOMNode().value = "";
    this.refs.proto.getDOMNode().value = "_udp";
  },
  render: function() {
    var record = this.props.record;
    var data = record && record.data || {};
    var protos = ['_udp', '_tcp', '_tls'];
    var options = protos.map(function(proto) {
      return <option key={proto} value={proto}>{proto}</option>
    });
    return (
      <td className="multi-input">
        <div>
          <label>Service</label>
          <input type="text" ref="service" defaultValue={data.service} />
        </div>
        <div>
          <label>Proto</label>
          <select ref="proto" defaultValue={data.proto}>{options}</select>
        </div>
      </td>
    )
  }
});
var TextValue = React.createClass({
  getValue: function() {
    return {
      content: this.refs.value.getDOMNode().value.trim()
    }
  },
  clear: function() {
    this.refs.value.getDOMNode().value = "";
  },
  render: function() {
    return (
      <td><input type="text" ref="value" defaultValue={this.props.record.content} /></td>
    )
  }
});
var MXValue = React.createClass({
  getValue: function() {
    return {
      content: this.refs.value.getDOMNode().value.trim(),
      priority: this.refs.priority.getDOMNode().value.trim()
    }
  },
  clear: function() {
    this.refs.value.getDOMNode().value = "";
    this.refs.priority.getDOMNode().value = "";
  },
  render: function() {
    return (
      <td className="multi-input">
        <div>
          <label>Domain</label>
          <input type="text" ref="value" defaultValue={this.props.record.content} />
        </div>
        <div>
          <label>Priority</label>
          <input type="number" ref="priority" minValue="0" maxValue="65535" defaultValue={this.props.record.priority} />
        </div>
      </td>
    )
  }
});
var SRVValue = React.createClass({
  getValue: function() {
    return {
      data: {
        name: this.refs.name.getDOMNode().value.trim(),
        priority: this.refs.priority.getDOMNode().value.trim(),
        weight: this.refs.weight.getDOMNode().value.trim(),
        port: this.refs.port.getDOMNode().value.trim(),
        target: this.refs.target.getDOMNode().value.trim()
      }
    }
  },
  clear: function() {
    this.refs.name.getDOMNode().value = "";
    this.refs.priority.getDOMNode().value = "";
    this.refs.weight.getDOMNode().value = "";
    this.refs.port.getDOMNode().value = "";
    this.refs.target.getDOMNode().value = "";
  },
  render: function() {
    var record = this.props.record;
    var data = record && record.data || {};
    return (
      <td className="multi-input">
        <div>
          <label>Name</label>
          <input type="text" ref="name" defaultValue={data.name} />
        </div>
        <div>
          <label>Priority</label>
          <input type="number" ref="priority" minValue="0" maxValue="65535" defaultValue={data.priority} />
        </div>
        <div>
          <label>Weight</label>
          <input type="number" ref="weight" minValue="0" maxValue="65535" defaultValue={data.weight} />
        </div>
        <div>
          <label>Port</label>
          <input type="number" ref="port" minValue="0" maxValue="65535" defaultValue={data.port} />
        </div>
        <div>
          <label>Target</label>
          <input type="text" ref="target" defaultValue={data.target} />
        </div>
      </td>
    )
  }
});
function getNameComponent(type) {
  switch(type) {
    case 'SRV':
      return SRVName;
    default:
      return TextName;
  }
}
function getValueComponent(type) {
  switch(type) {
    case 'MX':
      return MXValue;
    case 'SRV':
      return SRVValue;
    default:
      return TextValue;
  }
}
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
    return {saving: false, type: 'A'};
  },
  types: ['A', 'AAAA', 'CNAME', 'LOC', 'MX', 'NS', 'SPF', 'SRV', 'TXT'],
  changeType: function(event) {
    this.setState({ type: event.target.value });
  },
  finishSave: function(promise) {
    promise.then(function() {
      this.setState({saving: false});
      this.reset();
    }.bind(this));
  },
  reset: function() {
    this.refs.name.clear();
    this.refs.value.clear();
  },
  commitAdd: function() {
    this.setState({saving: true});
    var newRecord = deepMerge({
      type: this.refs.type.getDOMNode().value,
      ttl: 1 // automatic
    }, this.refs.name.getName(), this.refs.value.getValue());
    this.finishSave(DomainStore.recordAdd(this.props.domain, newRecord));
  },
  render: function() {
    var className = this.state.saving ? 'saving' : '';
    var options = this.types.map(function(type) {
      return <option key={type} value={type}>{type}</option>
    });
    var Name = getNameComponent(this.state.type);
    var Value = getValueComponent(this.state.type);
    return (
      <tr className={className}>
        <td>
          <select ref="type" onChange={this.changeType}>
            {options}
          </select>
        </td>
        <Name ref="name" record={{}} />
        <Value ref="value" record={{}} />
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
    var newRecord = deepMerge({
      id: record.id.val(),
      type: record.type.val(),
      ttl: 1 // automatic
    }, this.refs.name.getName(), this.refs.value.getValue());
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
    var displayName = record.name.val();
    var zoneName = '.'+record.zone_name.val();
    var limit = displayName.length - zoneName.length;
    if(limit > 0 && displayName.substring(limit) === zoneName) {
      displayName = displayName.substring(0, limit);
    }
    if(this.state.state === 'edit') {
      var Name = getNameComponent(record.type.val());
      var Value = getValueComponent(record.type.val());
      return (
        <tr className={className}>
          <td className="record-type"><span className={record.type.val()}>{record.type.val()}</span></td>
          <Name ref="name" record={record.val()} />
          <Value ref="value" record={record.val()} />
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
