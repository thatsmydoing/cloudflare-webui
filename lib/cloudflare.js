var reqwest = require('reqwest');
var assign = require('react/lib/Object.assign');

function makeCall(method, path) {
  return function() {
    var localPath = path;
    var pathParams = null;
    var options = {};
    if(arguments.length > 0) {
      pathParams = arguments[0];
    }
    if(arguments.length > 1) {
      options = arguments[1];
    }
    if(typeof pathParams != "object") {
      pathParams = {zoneId: pathParams};
    }
    for(var key in pathParams) {
      localPath = localPath.replace(':'+key, pathParams[key]);
    }
    return reqwest({
      url: '/api'+localPath,
      data: method == 'GET' ? null : JSON.stringify(options),
      method: method,
      contentType: 'application/json'
    });
  };
}

module.exports = {
  domains: makeCall('GET', '/zones'),
  records: makeCall('GET', '/zones/:zoneId/dns_records'),
  recordAdd: makeCall('POST', '/zones/:zoneId/dns_records'),
  recordEdit: makeCall('PUT', '/zones/:zoneId/dns_records/:recId'),
  recordDelete: makeCall('DELETE', '/zones/:zoneId/dns_records/:recId'),
  setDevelopmentMode: makeCall('PATCH', '/zones/:zoneId/settings/development_mode'),
  purgeCache: makeCall('DELETE', '/zones/:zoneId/purge_cache')
};
