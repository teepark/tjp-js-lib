/*
datastructures - implementations of useful datastructures

class datastructures.SortedArray
  a subclass of the built-in Array, this class overrides some methods and adds
  some methods to enable indexing and inserting in logarithmic time

  static method SortedArray.fromsorted(inputArray)
    create a SortedArray without the cost of any sorting, input must be sorted

  constructor SortedArray()
    takes one or more arguments. if there is one argument and it is an array,
    uses that array's contents as the initial contents. otherwise, uses the
    list of arguments as the initial contents.

  instance method SortedArray.findIndex(item)
    find the index at which item would be stored. also indicates whether the
    provided item is already in the sortedarray by returning [index, itemFound]

  instance method SortedArray.insert(item)
    inserts the provided item into the Array in sorted position

  instance method SortedArray.indexOf(item)
    overridden to be faster than for normal Arrays, but otherwise functionally
    equivalent.

  instance method SortedArray.slice(item)
    overridden to return a SortedArray (since slices of sorted data are already
    sorted).

  * instance methods splice, push, and shift have been disabled as they don't
    make sense in the context of always-sorted data.
*/
/*global tjp*/

tjp.datastructures = {};

var SortedArray = tjp.datastructures.SortedArray = function() {
  var i;
  if (arguments.length == 1 && arguments[0] instanceof Array)
    for (i = 0; i < arguments[0].length; i++)
      Array.prototype.push.call(this, arguments[0][i]);
  else
    for (i = 0; i < arguments.length; i++)
      Array.prototype.push.call(this, arguments[i]);
  this.sort(tjp.base.sorter);
};

SortedArray.fromsorted = function(input) {
  var i, sa = new SortedArray();
  for (i = 0; i < input.length; i++)
    Array.prototype.push.call(sa, input[i]);
  return sa;
};

SortedArray.prototype = [];

SortedArray.prototype.insert = function(item) {
  Array.prototype.splice.call(this, this.findIndex(item)[0], 0, item);
};

SortedArray.prototype.indexOf = function(item) {
  var pair = this.findIndex(item);
  return pair[1] ? pair[0] : -1;
};

SortedArray.prototype.findIndex = function(item) {
  var bt = 0, tp = this.length, md, s;
  while (1) {
    if (tp === bt) return [bt, false];

    md = Math.floor((tp + bt) / 2);
    s = tjp.base.sorter(this[md], item);

    if (s > 0) tp = md;
    else if (s < 0) bt = md + 1;
    else return [md, true];
  }
};

SortedArray.prototype.toString = function() {
  return this.join(",");
};

SortedArray.prototype.slice = function() {
  return SortedArray.fromsorted(Array.prototype.slice.apply(this, arguments));
};

SortedArray.prototype.splice = function() {
  throw new Error("splice is not supported on SortedArray");
};

SortedArray.prototype.push = function() {
  throw new Error("push is not supported on SortedArray");
};

SortedArray.prototype.shift = function() {
  throw new Error("shift is not supported on SortedArray");
};
