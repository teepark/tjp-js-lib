/*
test - simple unit testing system for javascript

test.Runnable
  abstract base class for anything that can be contained in a Suite

test.Suite
*/

/*global TJP*/
//context:browser
//context:console

TJP.test = TJP.test || {};

function _now() { return (new Date()).getTime(); };

function _update(to, from) {
  for (var name in from) to[name] = from[name];
};

function AssertionError() {};
AssertionError.prototype = new Error();

function _assert(condition, error_message) {
  if (!condition) throw new AssertionError(error_message);
};

function _compare(a, b) {
  var i;

  if ((typeof a) !== (typeof b)) return false;

  switch(typeof a) {
    case "object":
      if (a === null) return b === null;

      if (a instanceof Array) {
        if (!(b instanceof Array)) return false;
          for (i = 0; i < a.length; i++) {
            if (!_compare(a[i], b[i])) return false;
          }
          return true;
      }

      for (i in a) {
        if (!_compare(a[i], b[i])) return false;
      }
      return true;

    case "number":
      if (isNaN(a)) return isNaN(b);
    default:
      return a === b;
  }
};

function Runnable() {};

function Test(run, opts) {
  opts = opts || {};
  this.runner = run;
  this.expected = 'expected' in opts ? opts.expected : undefined;
  this.args = 'args' in opts ? opts.args : [];
  this.setup = 'setup' in opts ? opts.setup : function() {};
  this.prepared = false;
};
Test.prototype = new Runnable();

var PASS = 0,
    FAIL = 1,
    ERROR = 2,
    COMPLETED = 3;

Test.prototype.prepare = function(parent_scope) {
  this.scope = {};

  _update(this.scope, parent_scope);

  this.setup.call(this.scope);

  this.prepared = true;
};

Test.prototype.bare_run = function() {
  var starttime, result = {};

  this.prepared = false;

  starttime = _now();

  try {
    result.produced = this.runner.apply(this.scope, this.args);

    result.time = _now() - starttime;

    result.completed = COMPLETED;
  } catch (e) {
    result.time = _now() - starttime;

    result.completed = ERROR;
    result.error = e;
  }

  return result;
};

Test.prototype.evaluate = function(result) {
  if (result.completed === ERROR)
    result.result = ERROR;
  else if (_compare(this.expected, result.produced))
    result.result = PASS;
  else
    result.result = FAIL;
};

function Suite(runnables, opts) {
  var i;
  opts = opts || {};

  this.setup = 'setup' in opts ? opts.setup : function() {};

  for (i = 0; i < runnables.length; i++)
    _assert(runnables[i] instanceof Runnable, "argument #" + (i + 1) +
        " is not a Runnable")

  this.runnables = runnables.slice();
};
Suite.prototype = new Runnable();

Suite.prototype.push = Suite.prototype.append = function (runnable) {
  this.runnables.push(runnable);
}

Suite.prototype.walkchildren = function(collector) {
  var i, child;
  collector = collector || [];

  for (i = 0; i < self.runnables.length; i++) {
    child = self.runnables[i];
    collector.push(child);
    if (child instanceof Suite) child.walkchildren(collector);
  }

  return collector;
};

Suite.prototype.walktests = function(collector) {
  var i, child;
  collector = collector || [];

  for (i = 0; i < self.runnables.length; i++) {
    child = self.runnables[i];
    if (child instanceof Test) collector.push(child);
    else if (child instanceof Suite) child.walktests(collector);
  }

  return collector;
};

Suite.prototype.walksuites = function(collector) {
  var i, child;
  collector = collector || [];

  for (i = 0; i < self.runnables.length; i++) {
    child = self.runnables[i];
    if (child instanceof Suite) {
      collector.push(child);
      child.walksuites(collector);
    }
  }

  return collector;
};

Suite.prototype.prepare = function(parent_scope) {
  this.scope = {};

  _update(this.scope, parent_scope);

  this.setup.call(this.scope);

  this.prepared = true;
};

Suite.prototype.bare_run = function() {
  var i,
      starttime,
      result = {
        'children': [],
        'completed': true,
      };

  this.prepared = false;

  starttime = _now();

  for (i = 0; i < this.runnables.length; i++)
    result['children'].push(this.runnables[i].bare_run());

  result.time = _now() - starttime;

  return result;
};

Suite.prototype.evaluate = function(result) {
  var i, child;

  result.result = PASS;

  for (i = 0; i < result.children.length; i++) {
    child = result.children[i];
    this.runnables[i].evaluate(child);

    if (child.result === ERROR)
      result.result = ERROR;
    else if (result.result !== ERROR && child.result === FAIL)
      result.result = FAIL;
  }
};

Test.prototype.run = Suite.prototype.run = function() {
  var result;

  if (!this.prepared) this.prepare();

  result = this.bare_run();

  this.evaluate(result);

  return result;
};

TJP.test.Runnable = Runnable;
TJP.test.Test = Test;
TJP.test.Suite = Suite;

TJP.test.PASS = PASS;
TJP.test.FAIL = FAIL;
TJP.test.ERROR = ERROR;
