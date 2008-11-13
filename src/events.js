/*
events - a fast, flexible event system for javascript

----------------
This file is based on Dean Edwards's addEvent implementation and
modified to work with non-HTMLElement targets and custom event types
----------------

event.addEvent(targetObj, evName, handlerFunc)
  add an event listener to targetObj

event.removeEvent(targetObj, evName, handlerFunc)
  undo an addEvent

event.dispatchEvent(targetObj, evName)
  trigger an event yourself
*/
/*global tjp*/

tjp.event = {};

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

tjp.event.addEvent = function(e, t, h) {
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

tjp.event.removeEvent = function(e, t, h) {
  if (e.removeEventListener) e.removeEventListener(t, h, false);
  else if (events[e] && events[e][t]) delete events[e][t][h.guid];
};

tjp.event.dispatchEvent = function(e, t) {
  if (e["on" + t]) e["on" + t]();
};
