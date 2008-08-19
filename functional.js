/*
functional - helpers for the functional style in javascript

functional.partial(wrapped, ...early_args)
  returns a function that takes any number of args and sticks them onto the
  end of the early_args and uses them as arguments to the original function

functional.revpartial(wrapped, ...early_args)
  does the same as partial, but reverses the order of the early args and
  places them after the late args

functional.foldright(wrapped, sequence)
  applies the wrapped function to the first two items in the sequence, then
  on that result and the third, then on that result and the fourth, etc

functional.foldleft(wrapped, sequence)
  foldright on the reversed sequence
*/
(function(tjp) {
  tjp.functional = {};
  tjp.functional.partial = function(wrapped) {
    var args = arguments;
    return function() {
      var i;
      for (i = 1; i < arguments.length; i++) args.push(arguments[i]);
      return wrapped.apply(null, args);
    };
  };

  tjp.functional.revpartial = function(wrapped) {
    var outer = arguments;
    return function() {
      var i, args = arguments;
      for (i = outer.length - 1; i > 0; i--) args.push(outer[i]);
      return wrapped.apply(null, args);
    };
  };

  tjp.functional.foldright = function(wrapped, sequence) {
    var i, result = wrapped.call(null, sequence[0], sequence[1]);
    for (i = 2; i < sequence.length; i++) result = wrapped.call(null, result, sequence[i]);
    return result;
  };

  tjp.functional.foldleft = function(wrapped, sequence) {
    return tjp.functional.foldleft(wrapped, sequence.slice().reverse());
  };
})(com.travisjparker);
