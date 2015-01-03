var cloudflare = require('./cloudflare');
var Cortex = require('cortexjs');

var DomainCortex = new Cortex([]);

function findDomain(name) {
  return DomainCortex.find(function(d) {
    return d.zone_name.val() === name;
  });
}

function loadRecords(name) {
  var domain = findDomain(name);
  if(domain.records.count() > 0) {
    return;
  }
  cloudflare.records(name).then(function(data) {
    domain.records.set(data.response.recs.objs);
  });
}

function loadSettings(name) {
  var domain = findDomain(name);
  if(domain.settings.val()) {
    return;
  }
  cloudflare.settings(name).then(function(data) {
    domain.settings.set(data.response.result.objs[0]);
  });
}

function recordAdd(name, record) {
  return cloudflare.recordAdd(name, record).then(function(data) {
    if(data.result === 'success') {
      findDomain(name).records.push(data.response.rec.obj);
    }
  });
}

function recordEdit(name, record) {
  return cloudflare.recordEdit(name, record).then(function(data) {
    if(data.result === 'success') {
      var domain = findDomain(name);
      var oldRecord = domain.records.find(function(r) {
        return r.rec_id.val() === record.id;
      });
      oldRecord.set(data.response.rec.obj);
    }
  });
}

function recordDelete(name, id) {
  return cloudflare.recordDelete(name, id).then(function(data) {
    if(data.result === 'success') {
      var domain = findDomain(name);
      var oldRecord = domain.records.find(function(r) {
        return r.rec_id.val() === id;
      });
      oldRecord.remove();
    }
  });
}

function setDevelopmentMode(name, value) {
  return cloudflare.setDevelopmentMode(name, value).then(function(data) {
    if(data.result === 'success') {
      findDomain(name).settings.dev_mode.set(data.response.expires_on || 0);
    }
  });
}

function purgeCache(name) {
  return cloudflare.purgeCache(name);
}

cloudflare.domains().then(function(data) {
  DomainCortex.set(data.response.zones.objs);
  DomainCortex.forEach(function(element) {
    element.add('records', []);
    element.add('settings', false);
  });
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
    loadSettings: loadSettings,
    cortex: DomainCortex
  }
};

window.Cortex = Cortex;
