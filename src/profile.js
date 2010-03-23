/*
profile - stupidly simple profiler

profile.start(name)
  start the `name` timer

profile.end(name)
  end the `name` timer

profile.get(name)
  get the milliseconds between the start and end of the `name` timer
*/

/*global TJP*/
//context:browser
//context:console

TJP.profile = TJP.profile || {};

var registry = {};

TJP.profile.start = function(name) {
  registry[name] = {complete: false, start: (new Date()).getTime()};
};

TJP.profile.end = function(name) {
  registry[name].time = (new Date()).getTime() - registry[name].start;
  registry[name].complete = true;
};

TJP.profile.get = function(name) {
  return registry[name].time;
};
