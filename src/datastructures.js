var typeorder = ["number", "string", "object", "undefined"];
function sorter(a, b) {
  var i, ta, tb, s, alen, blen;

  ta = typeorder.indexOf((typeof a));
  tb = typeorder.indexOf((typeof b));
  if (ta !== tb) return ta - tb;

  switch (typeof a) {
  case "number":
    return a - b;
  case "string":
    alen = a.length;
    blen = b.length;
    for (i = 0; i < Math.min(alen, blen); i++) {
      if (a.charCodeAt(i) > b.charCodeAt(i)) return 1;
      if (a.charCodeAt(i) < b.charCodeAt(i)) return -1;
    }
    if (alen > blen) return 1;
    if (alen < blen) return -1;
    return 0;
  case "object":
    if (a.length !== undefined && b.length !== undefined) {
      alen = a.length;
      blen = b.length;
      for (i = 0; i < Math.min(alen, blen); i++) {
        s = sorter(a[i], b[i]);
        if (s !== 0) return s;
      }
      if (alen > blen) return 1;
      if (alen < blen) return -1;
      return 0;
    }
  case "undefined":
  default:
    return 0;
  }
};

tjp.datastructures = {};

// constructor can take a single Array, or one or more items
var SortedArray = tjp.datastructures.SortedArray = function() {
  var i;
  if (arguments.length == 1 && arguments[0].length)
    for (i = 0; i < arguments[0].length; i++) this.push(arguments[0][i]);
  else
    for (i = 0; i < arguments.length; i++) this.push(arguments[i]);
  this.sort(sorter);
};

// static function to build a SortedArray from a pre-sorted array
SortedArray.fromsorted = function(input) {
  var i, sa = new SortedArray();
  for (i = 0; i < input.length; i++) sa.push(input[i]);
  // just like constructor, but skip sa.sort()
  return sa;
};

// subclassing Array
SortedArray.prototype = [];

// bisecting insert
SortedArray.prototype.insert = function(item) {
  this.splice(this.findIndex(item)[0], 0, item);
};

// overriding indexOf for O(log(n)) time
SortedArray.prototype.indexOf = function(item) {
  var pair = this.findIndex(item);
  return pair[1] ? pair[0] : -1;
};

// O(log(n)) time indexing
SortedArray.prototype.findIndex = function (item) {
  var i, base = 0, arr = this, s;
  while (1) {
    if (arr.length == 0) return [base, false];

    i = Math.floor(arr.length / 2);
    s = sorter(arr[i], item);

    if (s < 0) {
      arr = arr.slice(i + 1);
      base += i + 1;
    } else if (s > 0)
      arr = arr.slice(0, i);
    else
      return [base + i, true];
  }
};

SortedArray.prototype.toString = function() {
  return this.join(",");
};

SortedArray.prototype.slice = function() {
  return SortedArray.fromsorted([].slice.apply(this, arguments));
};
