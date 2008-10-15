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

----------------
The functions below are based on Dean Edwards's addEvent implementation
(modified to work with non-HTMLElement targets and custom event types)
----------------

base.addEvent(targetObj, evName, handlerFunc)
  add an event listener to targetObj

base.removeEvent(targetObj, evName, handlerFunc)
  undo an addEvent

base.dispatchEvent(targetObj, evName)
  trigger an event yourself
*/

var com;
com = com || {};
com.travisjparker = {};

(function(tjp) {
  tjp.base = {};

  tjp.base.extend = function(extended, extender) {
    for(var name in extender) extended[name] = extender[name];
    return extended;
  };

  tjp.base.urlencode = function(data) {
    var i, name, values, results = [];
    for (name in data) {
      values = data[name] instanceof Array ? data[name] : [data[name]];
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
      pair = pairs.split("=");
      name = decodeURIComponent(pair[0]);
      value = decodeURIComponent(pair[1]);
      if (!(name in results)) results[name] = [];
      results[name].push(value);
    }
    return results;
  };

  tjp.base.trim = function (str) {
    var
      ws = /\s/,
      i = str.length;
    str = str.replace(/^\s\s*/, '');
    while (ws.test(str.charAt(--i)));
    return str.slice(0, i + 1);
  };

  var fixEvent = function(e) {
    e.preventDefault = fixEvent.preventDefault;
    e.stopPropagation = fixEvent.stopPropagation;
    return e;
  };
  fixEvent.preventDefault = function() { this.returnValue = false; };
  fixEvent.stopPropagation = function() { this.cancelBubble = true; };

  var
    guid = 1,
    events = {},
    handleEvent = function(e, t) {
      var i, rv = true, hs;
      try {
        e = e || fixEvent(((this.ownerDocument || this.document || this).
            parentWindow || window).event || {type: t});
      } catch (err) { e = fixEvent({type: t}); }
      hs = events[e][e.type];
      for (i in hs) {
        this.handleEvent = hs[i];
        if (this.handleEvent(e) === false) rv = false;
      }
      delete this.handleEvent;
      return rv;
    };

  tjp.base.addEvent = function(e, t, h) {
    if (e.addEventListener) e.addEventListener(t, h, false);
    else {
      if (!h.guid) h.guid = guid++;
      if (!events[e]) events[e] = {};
      var hs = events[e][t];
      if (!hs) {
        hs = events[e][t] = {};
        if (e["on" + t]) hs[0] = e["on" + t];
      }
      hs[h.guid] = h;
      e["on" + t] = function(ev) {
        this.handleEvent = handleEvent;
        return this.handleEvent(ev, t);
      };
    }
  };

  tjp.base.removeEvent = function(e, t, h) {
    if (e.removeEventListener) e.removeEventListener(t, h, false);
    else if (events[e] && events[e][t]) delete events[e][t][h.guid];
  };

  tjp.base.dispatchEvent = function(e, t) {
    if (e["on" + t]) e["on" + t]();
  };
})(com.travisjparker);
