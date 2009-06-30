/*
test - simple unit testing system for javascript

test.Runnable
-------------
  abstract base class for Suites and Tests


test.Suite
----------
  a collection of Tests and sub-Suites

  Constructor
    new Suite(runnables, options)
      *runnables* is an Array of all contained tests and sub-suites (these can
        alse be added later).
      *options* is an optional object with some expected keys (all optional)
        options.setup is a function that will be called in the suite's scope
          before it executes
        options.teardown is a function that will be called in the suite's scope
          after it has executed
        options.scope is an object whose key-value pairs will be the start of
          the suite's scope

  Instance Methods
    push(runnable)
    append(runnable)
      add a Test or Suite to the collection

    walkchildren()
      produce an array of all tests and suites contained in this suite, and
      contained in all sub-suites recursively

    walktests()
      produce an array of all tests in this suite, and in all sub-suites
      recursively

    walksuites()
      produce an array of all sub-suites, and sub-sub-suites, etc. recursively

    run()
      run all tests and sub-suites in the suite, recursively, returning a
      result object (see below)


test.Test
---------
  a single unit test: contains a function, expected results, and options

  Constructor
    new Test(name, func, expected, options)
      *name* is the name of the test (will be used to identify it in results)
      *func* is the function to run as the test
      *expected* is the expected result of the function
      *options* is an optional object with particular expected attributes
        options.args is an array of the arguments to pass to *func*
        options.setup is a function to run in the context of the test's scope
          object right before *func* is run
        options.teardown is a function to run in the context of the test's
          scope oject right after *func* is run
        options.scope is a set of key-value pairs that will be the start of the
          test's scope

  Instance Methods
    run()
      runs *setup* in the context of the test's scope (see below),
      then starts a timer,
      then runs *func* in the scope, storing the return value,
      then stops the timer, recording the number of milliseconds
      then runs *teardown* in the scope,
      then compares the result of *func* with the expected value of the test,
      and returns a result object (see below)


Result Objects
--------------
  Runnable.run() always returns a result object, which can be expected to have
  the following attributes:

    completed: the runnable finished (always true for Suites)

    result: a constant indicating how the test or Suite finished
      test.PASS indicates that everything was fine
      test.FAIL indicates that the Test failed (or one of the runnables in a
        Suite)
      test.ERROR indicates that the function in the Test had an Error (or any
        of the Tests in a Suite)

    time: the time it took the runnable to complete, leaving out the time taken
      by the overhead of comparing expected and actual results, running setup
      and teardown functions, etc.

    runnabletype: either Test or Suite (the actual classes)

    runnable: the Test or Suite instance that created the result


  result objects from Test.run() have additional attributes:

    expected: the value the Test expected to receive

    produced: the value actually produced by the testing function

    testname: the name of the Test object

  result objects from Suite.run() have additional attributes:

    children: an Array of the result objects corresponding to the Suite's
      runnables


Testing Scope
-------------
  the *func* passed in to the Test constructor, as well as any setup and
  teardown functions, all get run in a particular scope ("this" inside the body
  of the functions).

  when you call run() on a Suite object, it creates its own testing scope and
  runs the Suite's setup function on it, then it passes that scope down to all
  its Tests and sub-Suites. the result is that setup() on a Suite can modify
  the scope of all contained tests.

  when you call run() on a Test, no setup function will run besides the one
  directly attached to the test.
*/

/*global TJP*/
//context:browser
//context:console

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

var PASS = 0,
    FAIL = 1,
    ERROR = 2,
    COMPLETED = 3;

function Runnable() {};

Runnable.prototype.run = function() {
  var result;

  this.prepare();

  result = this.bare_run();

  this.cleanup();

  this.evaluate(result);

  return result;
};

function Test(name, run, expected, opts) {
  opts = opts || {};
  this.name = name || '<Anonymous Test>';
  this.runner = run;
  this.expected = expected;
  this.args = 'args' in opts ? opts.args : [];
  this.setup = 'setup' in opts ? opts.setup : null;
  this.teardown = 'teardown' in opts ? opts.teardown : null;
  this.starting_scope = 'scope' in opts ? opts.scope : {};
};
Test.prototype = new Runnable();

Test.prototype.prepare = function(parent_scope) {
  var scope = this.scope = _update(this.starting_scope, {});

  _update(scope, parent_scope);

  if (this.setup) this.setup.call(scope);
};

Test.prototype.bare_run = function() {
  var starttime, result = {};

  starttime = _now();

  try {
    result.produced = this.runner.apply(this.scope, this.args);

    result.time = _now() - starttime;

    result.completed = true;
  } catch (e) {
    result.time = _now() - starttime;

    result.completed = false;
    result.error = e;
  }

  return result;
};

Test.prototype.cleanup = function() {
  if (this.teardown) this.teardown.call(this.scope);

  delete this.scope;
};

Test.prototype.evaluate = function(result) {
  if (!result.completed)
    result.result = ERROR;
  else if (_compare(this.expected, result.produced))
    result.result = PASS;
  else
    result.result = FAIL;
  result.runnabletype = Test;
  result.runnable = this;
  result.testname = this.name;
  result.expected = this.expected;
};

function Suite(runnables, opts) {
  var i;
  opts = opts || {};
  runnables = runnables || [];

  this.setup = 'setup' in opts ? opts.setup : function() {};
  this.teardown = 'teardown' in opts ? opts.teardown : function() {};
  this.starting_scope = 'scope' in opts ? opts.scope : {};

  for (i = 0; i < runnables.length; i++)
    _assert(runnables[i] instanceof Runnable, "argument #" + (i + 1) +
        " is not a Runnable")

  this.runnables = runnables.slice();
};
Suite.prototype = new Runnable();

Suite.prototype.prepare = function(parent_scope) {
  var i, scope = this.scope = _update(this.starting_scope, {});

  _update(scope, parent_scope);

  if (this.setup) this.setup.call(scope);

  for (i = 0; i < this.children.length; i++)
    this.children[i].prepare(scope);
};

Suite.prototype.bare_run = function() {
  var i,
      starttime,
      result = {
        'children': [],
      };

  starttime = _now();

  for (i = 0; i < this.runnables.length; i++)
    result['children'].push(this.runnables[i].bare_run());

  result.time = _now() - starttime;

  return result;
};

Suite.prototype.cleanup = function() {
  if (this.teardown) this.teardown.call(this.scope);

  delete this.scope;

  for (var i = 0; i < this.children.length; i++)
    this.children[i].teardown()
};

Suite.prototype.evaluate = function(results) {
  var i, child;

  results.result = PASS;

  for (i = 0; i < results.children.length; i++) {
    result = results.children[i];
    this.runnables[i].evaluate(result);

    if (result.result === ERROR)
      results.result = ERROR;
    else if (results.result !== ERROR && result.result === FAIL)
      results.result = FAIL;
  }

  results.runnabletype = Suite;
  results.runnable = this;
  results.completed = true;
};

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

TJP.test = TJP.test || {};

TJP.test.Runnable = Runnable;
TJP.test.Test = Test;
TJP.test.Suite = Suite;

TJP.test.PASS = PASS;
TJP.test.FAIL = FAIL;
TJP.test.ERROR = ERROR;
