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

module.exports = {
  dateToString: dateToString
}
