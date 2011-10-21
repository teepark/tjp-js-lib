/*
cookie - handy utilities for browser cookie CRUD

cookie.get(name)
  returns the value stored under name

cookie.getall()
  returns an object whose key/value pairs are all the cookies available

cookie.set(name, value, options)
cookie.set(mapping, options)
  stores value under name in the browser cookies
  options is an optional object whose key/value pairs customize the storage:
    - path: the url-path under which the cookie is accessible (default "/")
    - domain: the domain for which the cookie is accessible (defaults to
        anything under top-level host, e.g. www.example.com -> .example.com)
    - max-age: the number of seconds for which the cookie will last (defaults
        to null, meaning browser session)
    - expires: another way of specifying max-age, but max-age takes precedence
        and if expires is used, value will be converted to a max-age. this must
        be a GMTString (default null)
    - secure: if true, cookie is only available to web-pages under https 
        (default false)
  the second form sets all the name, value pairs in the mapping with an options
  argument in the same form as before

cookie.remove(name)
  removes the cookie with name (stores with max-age of 0)

cookie.clear()
  clears all the cookies that are currently available
*/

/*global TJP*/
//context:browser

TJP.cookie = TJP.cookie || {};

var defaultOptions = {
  path: "/",
  domain: "." + document.location.hostname.split(".").slice(-2).join("."),
  expires: -1,
  secure: false
};
defaultOptions["max-age"] = null;

TJP.cookie.get = function(name) {
  var i, pairs, pair;
  pairs = document.cookie.split("; ");
  for (i = 0; i < pairs.length; i++) {
    pair = pairs[i].split("=");
    if (pair[0] === name) return decodeURIComponent(pair[1]);
  }
  return null;
};

TJP.cookie.set = function(name, value, options) {
  var opt, expdate, cookiestr, ck;

  if ((typeof name) === "object") {
    // name is the mapping, value is now the options
    for (ck in name) TJP.cookie.set(ck, name[ck], value);
    return;
  }

  options = TJP.base.extend(TJP.base.extend({}, defaultOptions),
      options || {});
  value = encodeURIComponent(value);

  expdate = Date.parse(options.expires);
  if ((typeof options['max-age']) !== "number" && !isNaN(expdate)) {
    options['max-age'] = Math.round((expdate -
        (new Date()).getTime()) / 1000);
  }
  delete options.expires;

  if (options.domain === ".localhost") delete options.domain;

  cookiestr = name + "=" + value;
  for (opt in options) {
    if (options[opt] !== undefined && options[opt] !== null &&
        opt !== "secure")
      cookiestr += "; " + opt + "=" + options[opt];
  }
  if (options.secure) cookiestr += "; secure";

  document.cookie = cookiestr;
};

TJP.cookie.remove = function(name) {
  TJP.cookie.set(name, "", {"max-age": 0});
};

TJP.cookie.clear = function() {
  var name, ck = TJP.cookie.getall();
  for (name in ck) TJP.cookie.remove(name);
};

TJP.cookie.getall = function() {
  var i, pairs, pair, result = {};
  pairs = document.cookie.split("; ");
  for (i = 0; i < pairs.length; i++) {
    pair = pairs[i].split("=");
    result[pair[0]] = pair[1];
  }
  return result;
};
