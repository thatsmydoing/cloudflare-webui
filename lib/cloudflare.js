var reqwest = require('reqwest');
var assign = require('react/lib/Object.assign');

function makeCall(path) {
  return function(options) {
    return reqwest({
      url: '/api',
      data: assign({a: path}, options),
      method: 'POST'
    });
  };
}

module.exports = {
  domains: makeCall('zone_load_multi'),
  settings: function(domain) {
    return makeCall('zone_settings')({z: domain});
  },
  set_devmode: function(domain, toggle) {
    return makeCall('devmode')({z: domain, v: toggle ? 1 : 0});
  },
  purge_cache: function(domain) {
    return makeCall('fpurge_ts')({z: domain, v: 1});
  },
  records: function(domain) {
    return makeCall('rec_load_all')({z: domain});
  },
  record_add: function(domain, options) {
    return makeCall('rec_new')(assign({z: domain, ttl: 1}, options));
  },
  record_edit: function(domain, options) {
    return makeCall('rec_edit')(assign({z: domain, ttl: 1}, options));
  },
  record_delete: function(domain, id) {
    return makeCall('rec_delete')({z: domain, id: id});
  }
};

