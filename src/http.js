/*
http - functions for easy cross-browser HTTP requests

http.get(options)
  sends a GET request - same options as http.request except method.

http.post(options)
  sends a POST request - same options as http.request except method.

http.head(options)
  sends a HEAD request - same options as http.request except method.

http.request(options)
  sends a request using attributes of 'options' object for configuration:
    - url is the URL for the request (required)
    - method is the method such as GET, POST, etc (default "GET")
    - requestType will be the Content-Type header of the request (default
        "application/x-www-form-urlencoded")
    - responseType is the Content-Type to treat the response as,
        regardless of what is actually sent (default null)
    - timeout is a maximum amount of time in milliseconds to allow for an async
        request (default 0, which means no timeout)
    - data is an object whose properties are serialized and sent to the
        server in the format appropriate for the method (default null)
    - parseData is a flag for whether or not to automatically serialize
        options.data (default true)
    - async is whether or not to handle the response asynchronously
        (default true)
    - headers is an object whose properties are sent in the request as HTTP
        headers (default null)
    - success is a function to be used if the response succeeds in under the
        timeout - it will be passed a response object (default null)
    - failure is a function to be used if the response fails or times out - it
        will be passed a response object (default null)
  also returns the XMLHttpRequest object used.

Response objects:
  callback functions receive a single argument, the response. This is a
  javascript object with the following properties:
    - status: the status code (e.g. 200 for OK)
    - statusText: the string-representation of the status (e.g. "OK")
    - text: the text of the response
    - xml: if indicated by the Content-Type of the response or an overridden
        responseType, this is an XML document of the response
    - headers: an object whose name/value pairs are the headers of the response
*/

/*global tjp, ActiveXObject*/

tjp.http = {};

var defaultRequestOptions = {
  url: null,
  method: "GET",
  requestType: "application/x-www-form-urlencoded",
  responseType: null,
  timeout: 0,
  data: null,
  parseData: true,
  async: true,
  headers: null,
  success: null,
  failure: null
};

var ms_xml_types = [
  "Msxml6.XMLHTTP",
  "Msxml5.XMLHTTP",
  "Msxml4.XMLHTTP",
  "Msxml3.XMLHTTP",
  "Msxml2.XMLHTTP",
  "Microsoft.XMLHTTP"
];
function makeXHR() {
  var i;
  if (window.ActiveXObject) {
    for (i = 0; i < ms_xml_types.length; i++) {
      try { return new ActiveXObject(ms_xml_types[i]); }
      catch (e) {}
    }
  }
  return window.XMLHttpRequest ? new XMLHttpRequest() : null;
};

function parseHeaders(raw) {
  var i, lines, pair, result = {};
  lines = raw.split("\n");
  for (i = 0; i < lines.length; i++) {
    pair = lines[0].split(":");
    if (pair[1].slice(0, 1) === " ") pair[1] = pair[1].slice(1);
    result[pair[0].toLowerCase()] = pair[1];
  }
  return result;
};

tjp.http.get = function(o) {
  return tjp.http.request(tjp.base.extend(tjp.base.extend({}, o),
      {method: "GET"}));
};

tjp.http.post = function(o) {
  return tjp.http.request(tjp.base.extend(tjp.base.extend({}, o),
      {method: "POST"}));
};

tjp.http.head = function(o) {
  return tjp.http.request(tjp.base.extend(tjp.base.extend({}, o),
      {method: "HEAD"}));
};

tjp.http.request = function(o) {
  var name, xhr, tout = null;

  xhr = makeXHR();

  o = tjp.base.extend(tjp.base.extend({}, defaultRequestOptions), o);
  o.method = o.method.toString().toUpperCase();

  if (o.parseData && !(o.data instanceof String))
    o.data = tjp.base.urlencode(o.data);
  o.data = o.data.toString();
  if (o.data && (o.method === "GET" || o.method === "HEAD")) {
    o.url += "?" + o.data;
    o.data = null;
  }

  if (o.responseType !== null) xhr.overrideMimeType(o.responseType);

  if (o.url === null) return xhr;

  xhr.open(o.method, o.url, o.async);

  if (o.headers !== null)
    for (name in o.headers) xhr.setRequestHeader(name, o.headers[name]);

  xhr.setRequestHeader("Content-Type", o.requestType);

  if (o.async) {
    if (o.timeout) tout = setTimeout(function() {
      xhr.abort();
      tout = null;
    }, o.timeout);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (tout !== null) clearTimeout(tout);
        var response = {
            status: xhr.status,
            statusText: xhr.statusText,
            text: xhr.responseText,
            xml: xhr.responseXML,
            headers: parseHeaders(xhr.getAllResponseHeaders())
          },
          handler = (xhr.status >= 200 && xhr.status < 300) ?
            o.success : o.failure;
        if (handler instanceof Function) handler(response);
      }
    };
  }

  xhr.send(o.data);

  if (!o.async) {
    var response = {
        status: xhr.status,
        statusText: xhr.statusText,
        text: xhr.responseText,
        xml: xhr.responseXML,
        headers: parseHeaders(xhr.getAllResponseHeaders())
      },
      handler = (xhr.status >= 200 && xhr.status < 300) ?
        o.success : o.failure;
    if (handler instanceof Function) handler(response);
    return xhr;
  }
};
