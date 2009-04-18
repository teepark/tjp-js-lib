/*
bisect - functions for dealing with sorted arrays in O(log(n)) time

bisect.bisect(array, item[, low[, high]])
  alias for bisect_right

bisect.bisect_right(array, item[, low[, high]])
  returns the index in *array* at which *item* would be inserted, assuming
  *array* is sorted. if *item* is already in *array*, returns the index after
  the last match. if *low* and/or *high* are provided, limits the search to
  within those indexes.

bisect.bisect_left(array, item[, low[, high]])
  returns the index in *array* at which *item* would be inserted, assuming
  *array* is sorted. if *item* is already in *array*, returns the index of the
  first match. if *low* and/or *high* are provided, limits the search to
  within those indexes.

bisect.insort(array, item[, low[, high]])
  alias for insort_right

bisect.insort_right(array, item[, low[, high]])
  inserts *item* into *array*, maintaining sorted order. if *item* is already in
  *array*, inserts after the last instance of *item*. if *low* and/or *high* are
  provided, limits the search to within those indexes.

bisect.insort_left(array, item[, low[, high]])
  inserts *item* into *array*, maintaining sorted order. if *item* is already in
  *array*, inserts before the first instance of *item*. if *low* and/or *high*
  are provided, limits the search to within those indexes.
*/

/*global TJP*/
//context:browser
//context:console

var defaults = {
  'low': 0,
  'high': -1,
  'sorter': TJP.base.sorter
};

function findIndex(arr, item) {
  var md, s, o = TJP.base.extend(TJP.base.extend({}, defaults), arguments[2]),
    high = o.high >= o.low ? o.high : arr.length, low = o.low;
  while (1) {
    if (high === low) return [low, false];

    md = Math.floor((high + low) / 2);
    s = TJP.base.sorter(arr[md], item);

    if (s > 0) high = md;
    else if (s < 0) low = md + 1;
    else return [md, true];
  }
};

TJP.bisect = TJP.bisect || {};

TJP.bisect.bisect_right = function(arr, item) {
  var i, o = TJP.base.extend(TJP.base.extend({}, defaults), arguments[2]),
    indexFound = findIndex(arr, item, o);
  if (!indexFound[1]) return indexFound[0];
  for (i = indexFound[0] + 1; arr[i] === item && i < arr.length; i++);
  return i;
};

TJP.bisect.bisect_left = function(arr, item) {
  var i, o = TJP.base.extend(TJP.base.extend({}, defaults), arguments[2]),
    indexFound = findIndex(arr, item, o);
  if (!indexFound[1]) return indexFound[0];
  for (i = indexFound[0] - 1; arr[i] === item && i >= 0; i--);
  return i;
};

TJP.bisect.bisect = TJP.bisect.bisect_right;

TJP.bisect.insort_right = function(arr, item) {
  var o = TJP.base.extend(TJP.base.extend({}, defaults), arguments[2]);
  arr.splice(TJP.bisect.bisect_right(arr, item, o), 0, item);
};

TJP.bisect.insort_left = function(arr, item) {
  var o = TJP.base.extend(TJP.base.extend({}, defaults), arguments[2]);
  arr.splice(TJP.bisect.bisect_left(arr, item, o), 0, item);
};

TJP.bisect.insort = TJP.bisect.insort_right;
