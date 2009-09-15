/*
test - a simple javascript unit testing system
*/

/*global TJP*/

var test = TJP.test = TJP.test || {},
  base = TJP.base,
  event = TJP.event;

// result constants
test.PASS = "pass";
test.FAIL = "fail";
test.ERROR = "error";

function TestEnded() {};
TestEnded.prototype = new Error();

function getTime() { return (new Date()).getTime(); };

var BaseRunnable = {
  name: '<no name>',

  setup: function() {},
  teardown: function() {}
};

test.Suite = base.clone(BaseRunnable, {
  children: [],
  serial: false,
  type: "suite",

  execute: function() {
    startSuiteRun(setupSuite(this));
  }
});

test.Test = base.clone(BaseRunnable, {
  runner: function() {},
  type: "test",

  execute: function() {
    startTestRun(setupTest(this));
  }
});

var runGuid = 1;

function setupTest(theTest, scope) {
  scope = scope || {};

  // create the run object
  var run = {
    scope: scope,
    runnable: theTest,
    guid: runGuid++,
    runner: theTest.runner,
    finished: false
  };

  // add functions for the test's scope
  scope.end = function(result, msg) {
    run.finished = true;
    result = result || test.PASS;
    event.dispatch(run, "complete", {
      result: result,
      time: getTime() - run.started,
      error: result === test.ERROR ? msg : null,
      msg: result === test.FAIL ? msg : null
    });
    throw new TestEnded();
  };
  scope.fail = function(msg) { this.end(test.FAIL, msg); };
  scope.error = function(err) { this.end(test.ERROR, err); };
  scope.pass = function() { this.end(); };
  scope.assert = function(val, msg) { if (!val) this.fail(msg); };

  // call the setup() function on the scope
  theTest.setup.apply(run.scope);

  // forward the run object's complete as the test's complete
  event.oneTimer(run, "complete", function(target, type, data) {
    event.dispatch(theTest, "complete", {
      type: "test",
      runnable: theTest,
      result: data.result,
      time: data.time,
      error: data.error,
      msg: data.msg
    });
  });

  return run;
};

function setupSuite(suite, scope) {
  var i,
    run,
    count,
    childRun,
    childRuns = {},
    result = test.PASS,
    error = null;

  // create the run object
  run = {
    scope: scope || {},
    runnable: suite,
    guid: runGuid++,
    finished: false,
  };

  // call the suite's setup() function
  suite.setup.apply(run.scope);

  for (i = 0; i < suite.children.length; i++) {
    child = suite.children[i];

    // call setup(Suite|Test) for each child
    childRun = (child.type === "suite" ? setupSuite : setupTest)(
      child,
      base.clone(run.scope));

    // build a list of the childrens' run objects
    childRuns[childRun.guid] = childRun;

    (function(childRun) { // for a stationary "childRun"
      // listen for the childRun's complete event
      event.oneTimer(
        childRun,
        "complete",
        function(target, type, data) {
          if (!(data.runId in childRuns))
            throw new Error("bad childRun guid")

          // clear this out from the list of pending child runs
          childRuns[data.runId] = undefined;
          delete childRuns[data.runId];

          // update the suite run's result as necessary
          if (data.result === test.ERROR) {
            result = test.ERROR;
            error = data.error;
          }
          else if (data.result === test.FAIL) result = test.FAIL;

          // decrement the count of children to run,
          // and stop here if this wasn't the last child
          if (--count) return;

          // that was the last child so fire a complete for the suite
          run.finished = true;
          event.dispatch(
            run,
            "complete",
            {
              runId: run.guid,
              type: "suite",
              runnable: run.runnable,
              result: result,
              time: getTime() - run.started,
              error: error
            });
        });
    })(childRun);
  }

  // attach a copy of childRuns to the suite run
  run.children = base.extend({}, childRuns);

  // the count of children to run (decremented above)
  count = i;

  // forward the run's complete event as the suite's complete event
  event.oneTimer(run, "complete", function(target, type, data) {
    event.dispatch(suite, "complete", {
      type: "suite",
      runnable: suite,
      result: data.result,
      time: data.time,
      error: data.error
    });
  });

  return run;
};

function startTestRun(run) {
  run.started = getTime();
  try {
    run.runner.apply(run.scope);
  } catch (err) {
    if (!(err instanceof TestEnded)) {
      run.finished = true;
      event.dispatch(run, "complete", {
        result: test.ERROR,
        time: getTime() - run.started,
        error: err,
        msg: null
      });
    }
  }
};

function startSuiteRun(run) {
  var i, child;
  run.started = getTime();
  for (i in run.children) {
    child = run.children[i];
    (child.type === "test" ? startTestRun : startSuiteRun)(child);
  }
};
