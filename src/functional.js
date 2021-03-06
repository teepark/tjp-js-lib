/*
functional - helpers for the functional style in javascript

functional.map(func, arr)
  returns an array of objects resulting from calling
  func(arr[index], index, arr) for every assigned index in arr

functional.filter(func, arr)
  returns an array of all the elements in arr for which
  func(arr[index], index, arr) returns a true-ish value

functional.foreach(func, arr)
  runs func(arr[index], index, arr) for every index in arr

functional.all(func, arr)
  runs func(arr[index], index, arr) for every index in arr until it returns
  a false-ish value, at which point it returns false. if it gets all the
  way through, returns true

functional.any(func, arr)
  runs func(arr[index], index, arr) for every index in arr until it returns
  a true-ish value, at which point it returns true. if it gets all the
  way through, returns false

functional.partial(func, ...early_args)
  returns a function that takes any number of args and sticks them onto the
  end of the early_args and uses them as arguments to the original function

functional.revpartial(func, ...early_args)
  does the same as partial, but reverses the order of the early args and
  places them after the late args

functional.foldright(func, arr)
  applies the func function to the first two items in arr, then on that
  result and the third, then on that result and the fourth, etc, returning
  the final result

functional.foldleft(func, arr)
  foldright on the reversed arr

functional.compose(...functions)
  returns a function that applies each of the argument functions in order.
  only the first function may take more than one argument, as each of the
  others will accept the returned value of the previous one

functional.generate(item)
  returns a function that will always return item

functional.id(item)
  returns the argument unchanged

functional.propgetter(obj, name)
  returns obj[name] - primarily useful for creating other functions with
  functional.partial and functional.revpartial

functional.propsetter(obj, name, value)
  runs 'obj[name] = value' - also mainly for use with functional.partial
  and functional.revpartial

functional.methodrunner(obj, name, ...args)
  runs obj[name](...args)

function paramtransform(func, transformer)
  returns a function that will run func on the result of running
  transformer on the arguments. transformer can take any number of
  arguments but return an arr (these will be the arguments passed to
  func)
*/

/*global TJP*/
//context:browser
//context:console

TJP.functional = TJP.functional || {};

function isfunc(f) {
  if (typeof f !== "function") throw new TypeError();
};

TJP.functional.map = function(func, arr) {
  if (Array.prototype.map) return arr.map(func);

  var results, i, len;
  isfunc(func);
  len = arr.length;
  results = new Array(len);
  for (i = 0; i < len; i++) if (i in arr) results[i] = func(arr[i], i, arr);
  return results;
};

TJP.functional.filter = function(func, arr) {
  if (Array.prototype.filter) return arr.filter(func);

  var results, i, val;
  isfunc(func);
  results = new Array();
  for (i = 0; i < arr.length; i++) if (i in arr) {
    val = arr[i];
    if (func(val, i, arr)) results.push(val);
  }
  return results;
};

TJP.functional.foreach = function(func, arr) {
  if (Array.prototype.forEach) return arr.forEach(func);

  isfunc(func);
  for (var i = 0; i < arr.length; i++) if (i in arr) func(arr[i], i, arr);
};

TJP.functional.all = function(func, arr) {
  if (Array.prototype.every) return arr.every(func);

  isfunc(func);
  for (var i = 0; i < arr.length; i++) {
    if (i in arr && !func(arr[i], i, arr)) return false;
  }
  return true;
};

TJP.functional.any = function(func, arr) {
  if (Array.prototype.some) return arr.some(func);

  isfunc(func);
  for (var i = 0; i < arr.length; i++) {
    if (i in arr && func(arr[i], i, arr)) return true;
  }
  return false;
};

TJP.functional.partial = function(func) {
  var aps = Array.prototype.slice,
      outer = aps.call(arguments, 1);
  return function() {
    return func.apply(null, outer.concat(aps.call(arguments)));
  };
};

TJP.functional.revpartial = function(func) {
  var aps = Array.prototype.slice,
      apc = Array.prototype.concat,
      outer = aps.call(arguments, 1).reverse();
  return function() {
    return func.apply(null, apc.apply(arguments, outer));
  };
};

var curry = TJP.functional.curry = function(func, loaded) {
  var aps = Array.prototype.slice;
  loaded = loaded === undefined ? [] : loaded;
  return function() {
    var args = loaded.concat(aps.apply(arguments));
    if (args.length < func.length)
      return curry(func, args);
    return func.apply(null, args);
  };
};

TJP.functional.foldleft = function(func, arr, initial) {
  if (Array.prototype.reduce) return arr.reduce(func, initial);

  isfunc(func);
  var i, val, len = arr.length;
  if (len === 0 && initial === undefined) throw new TypeError();

  if (initial !== undefined) val = initial;
  else do {
    if (i in arr) {
      val = arr[i++];
      break;
    }

    if (++i >= len) throw new TypeError();
  } while (true);

  for (; i < len; i++) {
    if (i in arr) val = func.call(null, val, arr[i], i, arr);
  }

  return val;
};

TJP.functional.foldright = function(func, arr, initial) {
  if (Array.prototype.reduceRight) return arr.reduceRight(func, initial);

  return TJP.functional.foldleft(func, arr.slice().reverse(), initial);
};

TJP.functional.compose = function() {
  var args = arguments;
  return function(item) {
    var i;
    for (i = 0; i < args.length; i++) item = args[i](item);
    return item;
  };
};

TJP.functional.generate = function(item) {
  return function() { return item; };
};

TJP.functional.id = function(item) {
  return item;
};

TJP.functional.propgetter = function(obj, name) {
  return obj[name];
};

TJP.functional.propsetter = function(obj, name, value) {
  obj[name] = value;
};

TJP.functional.methodrunner = function(obj, name) {
  var args = [], i;
  for (i = 2; i < arguments.length; i++) args.push(arguments[i]);
  return obj[name].apply(obj, args);
};

TJP.functional.paramtransform = function(func, transformer) {
  return function() {
    var args = transformer.apply(null, arguments);
    return func.apply(null, args);
  };
};
