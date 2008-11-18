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
*/
/*global tjp*/

function coerce(str) {
  // a safer eval
  var as_num;

  if (str === "undefined") return undefined;
  if (str === "null") return null;
  as_num = Number(str);
  if (String(as_num) === str) return as_num;
  return str;
};

tjp.base = {};

tjp.base.extend = function(extended, extender) {
  for(var name in extender) extended[name] = extender[name];
  return extended;
};

tjp.base.urlencode = function(dataObj) {
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

tjp.base.urldecode = function(dataStr) {
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

tjp.base.trim = function (str) {
  var
    i,
    ws = /\s/,
  str = str.replace(/^\s\s*/, '');
  i = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
};

tjp.base.rtrim = function(str) {
  return str.replace(/^\s\s*/, '');
};

tjp.base.ltrim = function(str) {
  var
    ws = /\s/,
    i = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
};
