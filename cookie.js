/*
cookie - handy utilities for browser cookie CRUD

cookie.get(name)
  returns the value stored under name

cookie.getall()
  returns an object whose key/value pairs are all the cookies available

cookie.set(name, value, options)
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

cookie.remove(name)
  removes the cookie with name (stores with max-age of 0)
*/
(function(tjp) {
  tjp.cookie = {};

  tjp.cookie.get = function(name) {
    var i, pairs, pair, result = {};
    pairs = document.cookie.split(";");
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i].split("=");
      if (pair[0] === name) return pair[1];
    }
    return null;
  };

  tjp.cookie.set = function(name, value, options) {
    var opt, expdate, cookiestr;

    options = tjp.base.extend(tjp.base.extend({}, defaultOptions),
        options || {});

    expdate = Date.parse(options.expires);
    if (!(options['max-age'] instanceof Number) && !isNaN(expdate)) {
      options['max-age'] = Math.round((expdate -
          (new Date()).getTime()) / 1000);
    }
    delete options.expires;

    cookiestr = name + "=" + value;
    for (opt in options) {
      if (options[opt] != null && opt !== "secure")
        cookiestr += "; " + opt + "=" + options[opt];
    }
    if (options.secure) cookiestr += "; secure";

    document.cookie = cookiestr;
  };

  tjp.cookie.remove = function(name) {
    tjp.cookie.set(name, "", {"max-age": 0});
  };

  tjp.cookie.getall = function() {
    var i, pairs, pair, result = {};
    pairs = document.cookie.split(";");
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i].split("=");
      result[pair[0]] = pair[1];
    }
    return result;
  };

  var defaultOptions = {
    path: "/",
    domain: "." + document.location.hostname.split(".").slice(-2).join("."),
    expires: -1,
    secure: false
  };
  defaultOptions["max-age"] = null;
})(com.travisjparker);
