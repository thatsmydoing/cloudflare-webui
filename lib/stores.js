var cloudflare = require('./cloudflare');
var Cortex = require('cortexjs');

var DomainCortex = new Cortex([]);

function findDomain(name) {
  return DomainCortex.find(function(d) {
    return d.name.val() === name;
  });
}

function loadRecords(name) {
  var domain = findDomain(name);
  if(domain.records.count() > 0) {
    return;
  }
  cloudflare.records(domain.id.val()).then(function(data) {
    domain.records.set(data.result);
  });
}

function recordAdd(name, record) {
  var domain = findDomain(name);
  return cloudflare.recordAdd(domain.id.val(), record).then(function(data) {
    if(data.success) {
      domain.records.push(data.result);
    }
  });
}

function recordEdit(name, record) {
  var domain = findDomain(name);
  return cloudflare.recordEdit({zoneId: domain.id.val(), recId: record.id}, record).then(function(data) {
    if(data.success) {
      var oldRecord = domain.records.find(function(r) {
        return r.id.val() === record.id;
      });
      oldRecord.set(data.result);
    }
  });
}

function recordDelete(name, id) {
  var domain = findDomain(name);
  return cloudflare.recordDelete({zoneId: domain.id.val(), recId: id}).then(function(data) {
    if(data.success) {
      var oldRecord = domain.records.find(function(r) {
        return r.id.val() === id;
      });
      oldRecord.remove();
    }
  });
}

function setDevelopmentMode(name, value) {
  var domain = findDomain(name);
  return cloudflare.setDevelopmentMode(domain.id.val(), {value: value ? 'on' : 'off'}).then(function(data) {
    if(data.success) {
      domain.development_mode.set(data.response.expires_on || 0);
    }
  });
}

function purgeCache(name) {
  return cloudflare.purgeCache(findDomain(name).id.val(), {purge_everything: true});
}

cloudflare.domains().then(function(data) {
  data.result.forEach(function(domain) {
    domain.development_mode = Date.now() / 1000 + domain.development_mode;
    domain.records = [];
  });
  DomainCortex.set(data.result);
});

module.exports = {
  Domains: {
    find: findDomain,
    recordAdd: recordAdd,
    recordEdit: recordEdit,
    recordDelete: recordDelete,
    setDevelopmentMode: setDevelopmentMode,
    purgeCache: purgeCache,
    loadRecords: loadRecords,
    cortex: DomainCortex
  }
};

window.Cortex = Cortex;
