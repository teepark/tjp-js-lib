/*
test - simple (a)syncronous unit testing for javascript

test.test(func, options)
  creates and returns a test object with func as the test function and other
  configuration from attributes of the options argument:
    - arguments: an array of arguments to pass to the test function
    - setUp: a function to run before the test starts
    - tearDown: a function to run after the test finishes
    - sync: automatically pass the test when the testing function returns

test.suite(children, options)
  creates and returns a suite object, wrapping an array of tests and/or suites.
  configuration is pulled from attributes of the options argument:
    - setUp: a function to run before any of the suite children are started
    - tearDown: a function to run after all children have finished
    - sync: automatically pass child tests when their testing functions return


test objects
------------
run()
  executes the test function wrapped in setUp/tearDown

  when the test function finishes (and before tearDown), a "finished" event is
  dispatched from the test object. the data object in this event has attributes
  about the test run.
    - result: either test.PASS, test.FAIL or test.ERROR
    - passed: boolean, true if result is PASS, false otherwise
    - time: the time in seconds the test function took
    - error: if result is ERROR, this is the error object
    - message: any messages passed via scope.pass(), .fail() or .assert()


suite objects
-------------
addChild(child)
  adds a child, which must be a test or a suite

run()
  executes all the children's run functions, wrapped in the suite's setUp and
  tearDown functions.

  when all the children have finished, the suite dispatches a "finished" event
  in which the data object describes the suite run as a whole
    - result: either test.PASS, test.FAIL or test.ERROR. If any child results
        in ERROR so does the whole suite, and the suite only PASSes if all
        children do
    - passed: boolean, true if result is PASS, false otherwise
    - time: the time in seconds the run took (excluding setUp/tearDown phases)
    - children: an array of data objects like this one, one for each child

  suite.run supports a single options argument, which should be an object that
  can have a "randomize" key. if the corresponding value is true(ish), the
  children will be randomized, and {randomize: true} will be passed on to child
  suites.


scope of functions
------------------
all functions passed into the testing framework (testing functions and test and
scope setUps and tearDowns) are run in a particular scope, meaning that the
special variable "this" has a few useful attributes.

when a test is run directly a scope object is created, the setUp function (if
any) is run in that scope, the testing function is run in that same scope, and
finally so is the tearDown function once the test finishes.

in addition to any attributes added by the setUp function, the scope object has
a few methods that are always accessible (and, in fact, will overwrite
attributes of the same names that were set in setUp):

  - pass(message)
      end the test successfully, optionally passing through a message
  - fail(message)
      end the test unsuccessfully, optionally passing through a message
  - assert(truth, message)
      if *truth* is false-ish, ends the test as with fail

when a suite is run, its setUp is run in a new scope, and then for each child a
clone of the scope (with modifications from setUp) is made and used as the
scope for that child. the result is that suite.setUp modifications can be seen
in each child, but not vice-versa, and one child's setUp modifications can't be
seen in any other child.


asyncronous test example
------------------------
this is a simple test that will just make sure a resource is successfully
returned from the server. the testing function will return early, but once
either the success or failure functions is called, the test is completed.

var test = TJP.test.test(function() {
  var test_scope = this;

  TJP.http.get({
    url: "/some_resource.xml",
    success: function(response) {
      test_scope.pass();
    },
    failure: function(response) {
      test_scope.fail();
    }
  });
})

*/

/*global TJP*/
//context:browser
//context:console

var test = TJP.test = TJP.test || {};

var oneTimer = TJP.event.oneTimer,
    dispatch = TJP.event.dispatch,
    clone = TJP.base.clone,
    extend = TJP.base.extend;

var PASS = test.PASS = 0,
    FAIL = test.FAIL = 1,
    ERROR = test.ERROR = 2;

var TestComplete = function(result, message) {
  this.result = result;
  this.message = message;
  this.name = "TestComplete";
};
TestComplete.prototype = new Error();

var scopeExtension = function(run) {
  return {
    /* this will be swapped out once the original function returns */
    'complete': function(result, msg) { throw new TestComplete(result, msg); },

    'pass': function(msg) { this.complete(PASS, msg); },

    'fail': function(msg) { this.complete(FAIL, msg); },

    'assert': function(truth, msg) { if (!truth) this.complete(FAIL, msg); }
  };
};

var TestRun = {
  'suiteMember': false, // default value

  'create': function(test) {
    return clone(this, {'template': test, 'func': test.func, 'done': false});
  },

  'setUp': function(scope) {
    var self = this;

    scope = this.scope = clone(scope);
    if (this.template.forceSync) scope.__sync = this.template.sync;

    this.template.setUp.call(scope);

    oneTimer(this, "finished", function(target, type, data) {
      dispatch(self.template, type, data);
    });

    extend(scope, scopeExtension(this));
  },

  'complete': function(result, error, msg) {
    if (this.done) return;
    this.done = true;

    dispatch(this, "finished", {
      'result': result,
      'passed': !result,
      'time': ((new Date()).getTime() - this.started) / 1000,
      'error': error,
      'message': msg
    });

    if (!this.suiteMember) this.tearDown();
  },

  'tearDown': function() {
    this.template.tearDown.call(this.scope);

    delete this.scope;
  },

  'run': function() {
    this.started = (new Date()).getTime();

    try {
      this.func.apply(this.scope, this.arguments);
    } catch (error) {
      if (error instanceof TestComplete)
        this.complete(error.result, null, error.message);
      else
        this.complete(ERROR, error);
      return;
    }

    if (this.scope.__sync) self.complete(PASS);

    /* this relies on a somewhat tenuous assumption:
    javascript engines are typically single-threaded, so that responses to
    async events and timers will never trigger until all sync code is finished.
    we rely on that property here - if the test function returns without having
    thrown a TestComplete, we assume that we can run more code here before the
    async completion ever triggers. this is the best we can do to determine
    whether a test is sync or async without explicitly having to be told. */
    var self = this;
    this.scope.complete = function(result, msg) {
      self.complete(result, null, msg);
    };
  }
};

var SuiteRun = {
  'suiteMember': false, // default value

  'create': function(suite) {
    var i,
        child,
        children = [];

    for (i = 0; i < suite.children.length; i++) {
      child = makeRun(suite.children[i]);
      child.suiteMember = true;
      children.push(child);
    }

    return clone(this, {'template': suite, 'children': children});
  },

  'setUp': function(scope) {
    var i,
        self = this,
        child,
        children = this.children,
        run = this; // for closures below

    scope = this.scope = clone(scope);
    if (this.template.forceSync) scope.__sync = this.template.sync;
    this.results = new Array(children.length);
    this.doneCount = 0;

    this.template.setUp.call(scope);

    for (i = 0; i < children.length; i++) {
      child = children[i];

      (function(i) { // freeze i
        oneTimer(child, "finished", function(target, type, data) {
          run.results[i] = data;
          if (++run.doneCount === children.length)
            run.complete();
        });
      })(i);

      child.setUp(scope);
    }

    oneTimer(this, "finished", function(target, type, data) {
      dispatch(self.template, type, data);
    });
  },

  'complete': function() {
    var i,
        foundFail = false,
        foundError = false,
        result,
        results = this.results,
        ended = (new Date()).getTime();

    for (i = 0; i < results.length; i++) {
      result = results[i];
      if (result.result === ERROR) {
        foundError = true;
        break;
      } else if (result.result === FAIL) {
        foundFail = true;
      }
    }

    dispatch(this, "finished", {
      'result': foundError ? ERROR: (foundFail ? FAIL : PASS),
      'passed': !result,
      'time': (ended - this.started) / 1000,
      'children': results
    });

    if (!this.suiteMember) this.tearDown();
  },

  'tearDown': function() {
    var i,
        suiteTearDown = this.template.tearDown,
        scope = this.scope,
        children = this.children;

    for (i = 0; i < children.length; i++)
      children[i].tearDown();

    if (suiteTearDown) suiteTearDown.call(scope);

    delete this.scope;
  },

  'run': function(options) {
    var i,
        children = this.children;

    if (options && options.randomize)
      randomize(children);

    this.started = (new Date()).getTime();

    for (i = 0; i < children.length; i++)
      children[i].run.apply(children[i], arguments);
  }
};

var runTypes = {
  'test': TestRun,
  'suite': SuiteRun
};

function makeRun(runnable) {
  return runTypes[runnable.runType].create(runnable);
}

var Runnable = {
  'run': function() {
    var run,
        self = this;

    if (!TJP.event)
      throw new Error("TJP.test requires TJP.event");

    run = makeRun(this);
    run.setUp({});

    run.run.apply(run, arguments);
  }
};

var Test = clone(Runnable, {
  '_runType': 'test',

  'create': function(func, options) {
    options = options || {};

    return clone(this, {
      'func': func,
      'arguments': options.arguments || [],
      'setUp': options.setUp || function() {},
      'tearDown': options.tearDown || function() {},
      'sync': options.sync || false,
      'forceSync': 'sync' in options
    });
  }
});

function randomize(arr) {
  var i, r, temp, l = arr.length;
  for (i = l; i > 0; i--) {
    r = Math.floor(Math.random() * l);
    temp = arr[i - 1];
    arr[i - 1] = arr[r];
    arr[r] = temp;
  }
}

var Suite = clone(Runnable, {
  '_runType': 'suite',

  'create': function(children, options) {
    options = options || {};

    return clone(this, {
      'children': (children && children.length) ? children.slice() : [],
      'setUp': options.setUp || function() {},
      'tearDown': options.tearDown || function() {},
      'sync': options.sync || false,
      'forceSync': 'sync' in options
    });
  },

  'addChild': function(child) {
    this.children.push(child);
  }
});

test.test = function(func, options) {
  return Test.create(func, options);
};

test.suite = function(children, options) {
  return Suite.create(children, options);
};
