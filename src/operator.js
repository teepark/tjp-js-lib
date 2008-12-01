/*
operator - functions that simply wrap javascript operators

operator.add(a, b, ...) <--> a + b + ...

operator.sub(a, b, ...) <--> a - b - ...

operator.mult(a, b, ...) <--> a * b * ...

operator.div(a, b, ...) <--> a / b / ...

operator.mod(a, b, ...) <--> a % b % ...

operator.boolAnd(a, b, ...) <--> a && b && ...

operator.boolOr(a, b, ...) <--> a || b || ...

operator.bitAnd(a, b, ...) <--> a & b & ...

operator.bitOr(a, b, ...) <--> a | b | ...

operator.bitXOr(a, b, ...) <--> a ^ b ^ ...

operator.isinstance(obj, klass) <--> obj instanceof klass

operator.instantiate(klass, a, b) <--> new klass(a, b, ...)
*/

/*global tjp*/

tjp.operator = {};

tjp.operator.add = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total += arguments[i];
  return total;
};

tjp.operator.sub = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total -= arguments[i];
  return total;
};

tjp.operator.mult = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total *= arguments[i];
  return total;
};

tjp.operator.div = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total /= arguments[i];
  return total;
};

tjp.operator.mod = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total %= arguments[i];
  return total;
};

tjp.operator.boolAnd = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total = total && arguments[i];
  return total;
};

tjp.operator.boolOr = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total = total || arguments[i];
  return total;
};

tjp.operator.bitAnd = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total = total & arguments[i];
  return total;
};

tjp.operator.bitOr = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total = total | arguments[i];
  return total;
};

tjp.operator.bitXOr = function() {
  var i, total = arguments[0];
  for (i = 1; i < arguments.length; i++) total = total ^ arguments[i];
  return total;
};

tjp.operator.isinstance = function(obj, klass) {
  return obj instanceof klass;
};

tjp.operator.instantiate = function(klass) {
  var args = Array.prototype.slice.call(arguments, 1);
  switch(args.length) {
    case 0:
      return new klass();
    case 1:
      return new klass(args[0]);
    case 2:
      return new klass(args[0], args[1]);
    case 3:
      return new klass(args[0], args[1], args[2]);
    case 4:
      return new klass(args[0], args[1], args[2], args[3]);
    case 5:
      return new klass(args[0], args[1], args[2], args[3], args[4]);
    case 6:
      return new klass(args[0], args[1], args[2], args[3], args[4], args[5]);
    default:
      throw new Error("too many arguments for operator.instantiate");
  }
};