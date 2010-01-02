/*
events - a fast, flexible event system for javascript

------------------------------------------------------------------------
This file is loosely based on Dean Edwards's addEvent implementation and
modified to work with non-HTMLElement targets and custom event types
------------------------------------------------------------------------

event.add(targetObj, evName, handlerFunc)
event.listen(targetObj, evName, handlerFunc)
  add an event listener to targetObj. the listener function should take
  3 arguments, the event target, the event type, and a data object

event.oneTimer(targetObj, evName, handlerFunc)
  add an event listener to targetObj (like add/listen), but have it be
  automatically removed after the first call

event.remove(targetObj, [evName[, handlerFunc]])
event.unlisten(targetObj, evName, handlerFunc)
  undo an add

event.dispatch(targetObj, evName, data)
  trigger an event yourself. the 3 arguments will be passed straight to
  any active handler functions.
*/

/*global TJP*/
//context:browser
//context:console

TJP.event = TJP.event || {};

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
  handleEvent = function(target, type, data) {
    var i, rv = true, hs, errors = [];
    try {
      target = target || fixEvent(((this.ownerDocument || this.document ||
              this).parentWindow || window).event || {type: type});
    } catch (err) { target = fixEvent({type: type}); }
    hs = (events[target] ? events[target][type] : {}) || {};
    for (i in hs) {
      this.handleEvent = hs[i];
      try {
        if (this.handleEvent(target, type, data) === false) rv = false;
      } catch(e) { errors.push(e); }
    }
    delete this.handleEvent;
    if (errors.length) throw errors[0];
    return rv;
  };

TJP.event.add = TJP.event.listen = function(target, type, handler) {
  if (!handler.__guid) handler.__guid = guid++;
  if (!events[target]) events[target] = {};
  var handlers = events[target][type];
  if (!handlers) {
    handlers = events[target][type] = {};
    if (target["on" + type]) handlers[0] = target["on" + type];
  }
  handlers[handler.__guid] = handler;
  target["on" + type] = function(data) {
    this.handleEvent = handleEvent;
    return this.handleEvent(target, type, data);
  };
};

TJP.event.remove = TJP.event.unlisten = function(target, type, handler) {
  if (type === undefined)
    delete events[target];
  else if (handler === undefined && events[target])
    delete events[target][type]
  else if (events[target] && events[target][type])
    delete events[target][type][handler.__guid];
};

TJP.event.oneTimer = function(target, type, handler) {
  TJP.event.add(target, type, function(target, type, data) {
    TJP.event.remove(target, type, arguments.callee);
    return handler(target, type, data);
  });
};

TJP.event.dispatch = function(target, type, data) {
  if (target["on" + type]) return target["on" + type](data);
};
