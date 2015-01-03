var reqwest = require('reqwest');
var assign = require('react/lib/Object.assign');

function makeCall(path) {
  return function() {
    var domain = null;
    var options = {};
    if(arguments.length > 0) {
      domain = arguments[0];
    }
    if(arguments.length > 1) {
      options = arguments[1];
    }
    return reqwest({
      url: '/api',
      data: assign({a: path, z: domain}, options),
      method: 'POST'
    });
  };
}

module.exports = {
  domains: makeCall('zone_load_multi'),
  settings: makeCall('zone_settings'),
  records: makeCall('rec_load_all'),
  recordAdd: makeCall('rec_new'),
  recordEdit: makeCall('rec_edit'),
  recordDelete: function(domain, id) {
    return makeCall('rec_delete')(domain, {id: id});
  },
  setDevelopmentMode: function(domain, toggle) {
    return makeCall('devmode')(domain, {v: toggle ? 1 : 0});
  },
  purgeCache: function(domain) {
    return makeCall('fpurge_ts')(domain, {v: 1});
  }
};
