function pad(num) {
  if(num < 10) {
    return '0'+num;
  }
  else {
    return ''+num;
  }
}

function dateToString(date) {
    var dateString =
      date.getFullYear()+'/'+pad(1+date.getMonth())+'/'+ pad(date.getDate())+
      ' '+
      pad(date.getHours())+':'+pad(date.getMinutes());
    return dateString;
}

function merge(a, b) {
  for(var i in b) {
    var n = a[i];
    var o = b[i];
    if(typeof n == 'object' && typeof o == 'object') {
      merge(n, o);
    }
    else {
      a[i] = b[i];
    }
  }
  return a;
}

function deepMerge() {
  var ret = {};
  for(var i = 0; i < arguments.length; ++i) {
    merge(ret, arguments[i]);
  }
  return ret;
}

module.exports = {
  dateToString: dateToString,
  deepMerge: deepMerge
}
