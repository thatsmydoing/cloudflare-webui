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

function loadSettings(name) {
  var domain = findDomain(name);
  if(domain.settings.count() > 0) {
    return;
  }
  cloudflare.settings(domain.id.val()).then(function(data) {
    data.result.forEach(function(setting) {
      if(setting.id == 'development_mode') {
        setting.timestamp = Date.now() / 1000 + setting.time_remaining;
      }
    });
    domain.settings.set(data.result);
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

function settingChange(name, setting, value) {
  var domain = findDomain(name);
  var params = {zoneId: domain.id.val(), setting: setting};
  return cloudflare.settingChange(params, {value: value}).then(function(data) {
    if(data.success) {
      if(data.result.id == 'development_mode') {
        data.result.timestamp = Date.now() / 1000 + data.result.time_remaining;
      }
      domain.settings.find(function(s) { return s.id.val() == setting }).set(data.result);
    }
  });
}

function purgeCache(name) {
  return cloudflare.purgeCache(findDomain(name).id.val(), {purge_everything: true});
}

cloudflare.domains().then(function(data) {
  data.result.forEach(function(domain) {
    domain.records = [];
    domain.settings = [];
  });
  DomainCortex.set(data.result);
});

module.exports = {
  Domains: {
    find: findDomain,
    recordAdd: recordAdd,
    recordEdit: recordEdit,
    recordDelete: recordDelete,
    settingChange: settingChange,
    purgeCache: purgeCache,
    loadRecords: loadRecords,
    loadSettings: loadSettings,
    cortex: DomainCortex
  }
};

window.Cortex = Cortex;
