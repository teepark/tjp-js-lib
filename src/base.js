/*
base - the groundwork

base.extend(extended, extender)
base.mixin(extended, extender)
  add properties of extender to extended, then return the modified extended

base.clone([baseObj[, extender]])
base.object([baseObj[, extender]])
  create a new copy of baseObj (defaults to a new empty object) by means of
  prototype inheritance, and then add the attributes of extender

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

base.getType(obj)
  return a string representation of the type of an object, a little more
  specific than the 'typeof' operator. strings it might return:
    array
    boolean
    date
    function
    NaN
    null
    number
    object
    regexp
    string
    undefined

base.deepCompare(obj, obj)
  compare objects for equality, including recursively comparing contained
  data in arrays and objects

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

var extend = TJP.base.extend = TJP.base.mixin = function(extended, extender) {
  for(var name in extender) extended[name] = extender[name];
  return extended;
};

TJP.base.object = TJP.base.clone = function() {
  var klass, obj, i;

  if (!arguments.length) return {};

  if (Object.create)
    obj = Object.create.apply(null, Array.prototype.slice.call(arguments));
  else {
    klass = function() {};
    klass.prototype = arguments[0];
    obj = new klass();
    if (arguments.length > 1) {
      for (i = arguments.length - 1; i; --i)
        extend(obj, arguments[i]);
    }
  }

  if (obj.init) obj.init();
  return obj;
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
  str = str.replace(ltrim_regex, '');
  var i = str.length;
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

var getType = TJP.base.getType = function(obj) {
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
    case "function":
    default:
      return dumbtype;
  }
};

var indexOf = TJP.base.indexOf = function(arr, item) {
  if (arr.indexOf) return arr.indexOf(item);
  for (var i = 0; i < arr.length; i++)
    if (arr[i] === item)
      return i;
  return -1;
};

var deepCompare = TJP.base.deepCompare = function(a, b) {
  var i,
      atype = getType(a),
      btype = getType(b);

  if (atype !== btype) return false;
  switch(atype) {
  case "array":
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++)
      if (!deepCompare(a[i], b[i])) return false;
    return true;
  case "object":
    for (i in a)
      if (!(i in b && deepCompare(a[i], b[i]))) return false;
    for (i in b)
      if (!(i in a && deepCompare(a[i], b[i]))) return false;
    return true;
  case "boolean":
  case "number":
  case "string":
    return a === b;
  case "NaN":
  case "null":
  case "undefined":
    return true;
  case "date":
    return a.getTime() === b.getTime();
  case "function":
  case "regexp":
    return String(a) === String(b);
  }
};

var typeorder = ["number", "string", "object", "undefined"];
var sorter = TJP.base.sorter = function(a, b) {
  var i, ta, tb, s, alen, blen;

  ta = indexOf(typeorder, typeof a);
  tb = indexOf(typeorder, typeof b);
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
        s = sorter(a[i], b[i]);
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
