/*
test - simple asyncronous unit testing for javascript
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

var TestComplete = function(result) {
  this.result = result;
  this.name = "TestComplete";
};
TestComplete.prototype = new Error();

var scopeExtension = function(run) {
  return {
    '__run': run,
    'pass': function() { throw new TestComplete(PASS); },
    'fail': function() { throw new TestComplete(FAIL); },
    'assert': function(truth) { if (!truth) throw new TestComplete(FAIL); },
    'setTimeout': function(func, interval) {
      var i,
          scope = this,
          args = Array.prototype.slice.call(arguments);

      args[0] = function() {
        try {
          func.apply(scope, args.slice(2));
        } catch (error) {
          if (error instanceof TestComplete)
            scope.__run.complete(error.result);
          else
            scope.__run.complete(ERROR, error);
        }
      };
      setTimeout.apply(null, args);
    }
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

    this.template.setUp.call(scope);

    oneTimer(this, "finished", function(target, type, data) {
      dispatch(self.template, type, data);
    });

    extend(scope, scopeExtension(this));
  },

  'complete': function(result, error) {
    if (this.done) return;
    this.done = true;

    dispatch(this, "finished", {
      'result': result,
      'passed': !result,
      'time': ((new Date()).getTime() - this.started) / 1000,
      'error': error
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
        this.complete(error.result);
      else
        this.complete(ERROR, error);
    }
	}
};

var SuiteRun = {
  'suiteMember': false, // default value

  'create': function(suite) {
    var i,
        child,
        children = [];

    for (i = 0; i < suite.children.length; i++) {
      child = suite.children[i]._makeRun();
      child.suiteMember = true;
      children.push(child);
    }

    return clone(this, {'template': suite, 'children': children});
  },

  'setUp': function(scope) {
    var i,
        self = this,
        suiteSetUp = this.template.setUp,
        child,
        children = this.children,
        run = this; // for closures below

    scope = this.scope = clone(scope);
    this.results = new Array(children.length);
    this.doneCount = 0;

    if (suiteSetUp) suiteSetUp.call(scope);

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
        error,
        result,
        results = this.results,
        ended = (new Date()).getTime();

    for (i = 0; i < results.length; i++) {
      result = results[i];
      if (result.result === ERROR) {
        foundError = true;
        error = result.error;
        break;
      } else if (result.result === FAIL) {
        foundFail = true;
      }
    }

    dispatch(this, "finished", {
      'result': foundError ? ERROR: (foundFail ? FAIL : PASS),
      'passed': !result,
      'time': (ended - this.started) / 1000,
      'error': foundError ? error : undefined,
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

  'run': function() {
    var i,
        children = this.children;

    this.started = (new Date()).getTime();

    for (i = 0; i < children.length; i++) {
      children[i].run();
    }
  }
};

var Runnable = {
  '_makeRun': function() {
    return this._runType.create(this);
  },

  'run': function() {
    var run,
        self = this;

    if (!TJP.event)
      throw new Error("TJP.test requires TJP.event");

    run = this._makeRun();
    run.setUp({});

    run.run();
  }
};

var TestObject = clone(Runnable, {
  '_runType': TestRun,

  'create': function(func, options) {
    options = options || {};

    return clone(this, {
      'func': func,
      'arguments': options.arguments || [],
      'setUp': options.setUp || function() {},
      'tearDown': options.tearDown || function() {}
    });
  }
});

var SuiteObject = clone(Runnable, {
  '_runType': SuiteRun,

  'create': function(children, options) {
    options = options || {};

    return clone(this, {
      'children': (children && children.length) ? children.slice() : [],
      'setUp': options.setUp || function() {},
      'tearDown': options.tearDown || function() {}
    });
  },

  'addChild': function(child) {
    this.children.push(child);
  }
});

test.test = function(func, options) {
  return TestObject.create(func, options);
};

test.suite = function(children, options) {
  return SuiteObject.create(children, options);
};
