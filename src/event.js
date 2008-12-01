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

var fixEvent = function(target) {
  target.preventDefault = fixEvent.preventDefault;
  target.stopPropagation = fixEvent.stopPropagation;
  return target;
};
fixEvent.preventDefault = function() { this.returnValue = false; };
fixEvent.stopPropagation = function() { this.cancelBubble = true; };

var
  guid = 1,
  events = {},
  handleEvent = function(target, type) {
    var i, rv = true, hs;
    try {
      target = target || fixEvent(((this.ownerDocument || this.document ||
              this).parentWindow || window).event || {type: type});
    } catch (err) { target = fixEvent({type: type}); }
    hs = events[target][target.type];
    for (i in hs) {
      this.handleEvent = hs[i];
      if (this.handleEvent(target) === false) rv = false;
    }
    delete this.handleEvent;
    return rv;
  };

tjp.event.addEvent = function(target, type, handler) {
  if (target.addEventListener) target.addEventListener(type, handler, false);
  else {
    if (!handler.guid) handler.guid = guid++;
    if (!events[target]) events[target] = {};
    var handlers = events[target][type];
    if (!handlers) {
      handlers = events[target][type] = {};
      if (target["on" + type]) handlers[0] = target["on" + type];
    }
    handlers[handler.guid] = handler;
    target["on" + type] = function(ev) {
      this.handleEvent = handleEvent;
      return this.handleEvent(ev, type);
    };
  }
};

tjp.event.removeEvent = function(target, type, handler) {
  if (target.removeEventListener)
    target.removeEventListener(type, handler, false);
  else if (events[target] && events[target][type])
    delete events[target][type][handler.guid];
};

tjp.event.dispatchEvent = function(target, type) {
  if (target["on" + type]) target["on" + type]();
};
