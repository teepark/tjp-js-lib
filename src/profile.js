/*
profile - stupidly simple profiler

create(): return a new Profiler

Profiler: class
  .start(): mark the time as the start time and wipe any recorded intervals
  .push(): record the time since the last start() call inside the instance
  .pop(): get the last push()ed time interval, removing it from the instance
  .poppush(): pop() and then push(), returning the pop() result
  .last(): get the last push()ed time interval, leaving it on the instance
  .all(): returns an array of all time intervals
  .wipe(): get the array of all time intervals, clearing them from the instance
*/

/*global TJP*/
//context:browser
//context:console

var clone = TJP.base.clone;

TJP.profile = TJP.profile || {};


TJP.profile.create = function() {
  return clone(this.Profiler);
};


TJP.profile.Profiler = {
  start: function() {
    this.wipe();
    this.started = (new Date()).getTime();
  }

  ,push: function() {
    this.times.push((new Date()).getTime() - this.started);
  }

  ,pop: function() {
    return this.times.pop();
  }

  ,poppush: function() {
    var time = this.pop();
    this.push();
    return time;
  }

  ,last: function() {
    return this.times[this.times.length - 1];
  }

  ,all: function() {
    return this.times.slice();
  }

  ,wipe: function() {
    var times = this.times;
    this.times = [];
    return times;
  }
};
