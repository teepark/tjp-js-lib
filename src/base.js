/*
base - the groundwork

base.extend(extended, extender)
  add properties of extender to extended, then return the modified extended

base.urlencode(dataObj)
  serialize dataObj's key/value pairs into form-urlencoding
    any values in dataObj that are arrays will have their items iterated through
    and added to the resulting string

base.urldecode(dataStr)
  deserialize dataStr's data from form-urlencoding
    values in the return obj are all arrays, because the same key may appear
    more than once in urlencoding

base.trim(str)
  most efficient javascript whitespace trim known to man
  courtesy of Steve Leviathan
    (http://blog.stevenlevithan.com/archives/faster-trim-javascript)

base.rtrim(str)
  like trim(), but only trimming the right side

base.ltrim(str)
  like trim(), but only trimming the left side

base.gettype(obj)
  return a string representation of the type of an object, a little more
  specific than the 'typeof' operator

base.sorter(obj, obj)
  the sorting function used throughout the library by default
*/
/*global TJP*/

function coerce(str) {
  // like a safer eval
  var as_num;

  if (str === "undefined") return undefined;
  if (str === "null") return null;
  if (str === "NaN") return NaN;
  if (str === "Infinity") return Infinity;
  if (str === "-Infinity") return -Infinity;
  as_num = Number(str);
  if (String(as_num) === str) return as_num;
  return str;
};

TJP.base = TJP.base || {};

TJP.base.extend = function(extended, extender) {
  for(var name in extender) extended[name] = extender[name];
  return extended;
};

TJP.base.urlencode = function(dataObj) {
  var i, name, values, results = [];
  for (name in dataObj) {
    values = dataObj[name] instanceof Array ? dataObj[name] : [dataObj[name]];
    for (i = 0; i < values.length; i++)
      results.push([
        encodeURIComponent(name),
        encodeURIComponent(values[i])
      ].join("="));
  }
  return results.join("&");
};

TJP.base.urldecode = function(dataStr) {
  var i, name, value, pair, pairs, results = {};
  pairs = dataStr.split("&");
  for (i = 0; i < pairs.length; i++) {
    pair = pairs[i].split("=");
    name = decodeURIComponent(pair[0]);
    value = decodeURIComponent(pair[1]);

    if (!(name in results)) results[name] = [];
    results[name].push(coerce(value));
  }
  return results;
};

var ltrim_regex = new RegExp('^\\s\\s*'),
    space_regex = new RegExp('\\s');

TJP.base.trim = function (str) {
  var i;
  str = str.replace(ltrim_regex, '');
  i = str.length;
  while (space_regex.test(str.charAt(--i)));
  return str.slice(0, i + 1);
};

TJP.base.ltrim = function(str) {
  return str.replace(ltrim_regex, '');
};

TJP.base.rtrim = function(str) {
  var i = str.length;
  while (space_regex.test(str.charAt(--i)));
  return str.slice(0, i + 1);
};

TJP.base.gettype = function(obj) {
  var dumbtype = typeof obj;
  switch(dumbtype) {
    case "object":
      if (obj instanceof Number) return "number";
      if (obj instanceof String) return "string";
      if (obj instanceof Boolean) return "boolean";
      if (obj instanceof Array) return "array";
      if (obj instanceof Date) return "date";
      if (obj instanceof RegExp) return "regexp";
      if (obj === null) return "null";
      return "object";
    case "number":
      if (isNaN(obj)) return "NaN";
    case "string":
    case "boolean":
    case "undefined":
    default:
      return dumbtype;
  }
};

var typeorder = ["number", "string", "object", "undefined"];
TJP.base.sorter = function(a, b) {
  var i, ta, tb, s, alen, blen;

  ta = typeorder.indexOf((typeof a));
  tb = typeorder.indexOf((typeof b));
  if (ta !== tb) return ta - tb;

  switch (typeof a) {
  case "number":
    return a - b;
  case "string":
    alen = a.length;
    blen = b.length;
    for (i = 0; i < Math.min(alen, blen); i++) {
      if (a.charCodeAt(i) > b.charCodeAt(i)) return 1;
      if (a.charCodeAt(i) < b.charCodeAt(i)) return -1;
    }
    if (alen > blen) return 1;
    if (alen < blen) return -1;
    return 0;
  case "object":
    if (a.length !== undefined && b.length !== undefined) {
      alen = a.length;
      blen = b.length;
      for (i = 0; i < Math.min(alen, blen); i++) {
        s = TJP.base.sorter(a[i], b[i]);
        if (s !== 0) return s;
      }
      if (alen > blen) return 1;
      if (alen < blen) return -1;
      return 0;
    }
    if (a.length !== undefined && b.length === undefined) return -1;
    if (a.length === undefined && b.length !== undefined) return 1;
    break; //might as well satisfy jslint
  default:
    return 0;
  }
};
