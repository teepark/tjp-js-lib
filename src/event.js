/*
events - a fast, flexible event system for javascript

----------------
This file is based on Dean Edwards's addEvent implementation and
modified to work with non-HTMLElement targets and custom event types
----------------

event.add(targetObj, evName, handlerFunc)
  add an event listener to targetObj

event.remove(targetObj, evName, handlerFunc)
  undo an add

event.dispatch(targetObj, evName)
  trigger an event yourself
*/

/*global tjp*/
//context:browser
//context:console

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

tjp.event.add = function(target, type, handler) {
  if (!handler.__guid) handler.__guid = guid++;
  if (!events[target]) events[target] = {};
  var handlers = events[target][type];
  if (!handlers) {
    handlers = events[target][type] = {};
    if (target["on" + type]) handlers[0] = target["on" + type];
  }
  handlers[handler.__guid] = handler;
  target["on" + type] = function(ev) {
    this.handleEvent = handleEvent;
    return this.handleEvent(ev, type);
  };
};

tjp.event.remove = function(target, type, handler) {
  if (events[target] && events[target][type])
    delete events[target][type][handler.__guid];
};

tjp.event.dispatch = function(target, type) {
  if (target["on" + type]) target["on" + type]();
};
