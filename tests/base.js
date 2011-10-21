
var t = TJP.test;


var baseSuite = t.suite([], {
  setUp: function() { this.b = TJP.base; }
});


/*
var coercionSuite = t.suite([

  t.test(function() {
    this.assert(this.c("undefined") === undefined);
  }),

  t.test(function() {
    this.assert(this.c("null") === null);
  }),

  t.test(function() {
    this.assert(isNaN(this.c("NaN")));
  }),

  t.test(function() {
    this.assert(this.c("Infinity") === Infinity);
  }),

  t.test(function() {
    this.assert(this.c("-Infinity") === -Infinity);
  }),

  t.test(function() {
    this.assert(this.c("1234") === 1234);
  }),

  t.test(function() {
    this.assert(this.c("12.34") === 12.34);
  }),

  t.test(function() {
    this.assert(this.c("hello, world!") === "hello, world!");
  })

], {
  setUp: function() { this.c = this.b.coerce; },
  tearDown: function() { delete this.c; },
  sync: true
});

baseSuite.addChild(coercionSuite);
*/


var cloneSuite = t.suite([

  t.test(function() {
    var start = {'a': 1, 'b': 2};
    var next = this.c(start, {'b': 4});

    this.assert(next.a === 1);
    this.assert(next.b === 4);
    delete next.b;
    this.assert(next.b === 2);
  }),

  t.test(function() {
    var start = {'a': 3, 'b': 7};
    var next = this.c(start, {'b': 11, 'c': 17});

    this.assert(next.a === 3);
    this.assert(next.b === 11);
    this.assert(next.c === 17);
    next.b = 23;
    this.assert(next.b === 23);
    delete next.b;
    this.assert(next.b === 7);
    delete next.c;
    this.assert(next.c === undefined);
  })

], {
  setUp: function() { this.c = this.b.clone; },
  tearDown: function() { delete this.c; },
  sync: true
});

baseSuite.addChild(cloneSuite);


var urlencodingSuite = t.suite([

  t.test(function() {
    var s = "foo=bar&spam=eggs";
    var o = this.d(s);

    this.assert(o.foo instanceof Array, "failure 1");
    this.assert(o.spam instanceof Array, "failure 2");

    this.assert(o.foo[0] === "bar", "failure 3");
    this.assert(o.spam[0] === "eggs", "failure 4");
  }),

  t.test(function() {
    var s = "a=1&b=4.3&c=null";
    var o = this.d(s);

    this.assert(o.a instanceof Array, "failure 5")
    this.assert(o.b instanceof Array, "failure 6")
    this.assert(o.c instanceof Array, "failure 7")

    this.assert(o.a[0] === 1, "failure 8");
    this.assert(o.b[0] === 4.3, "failure 9");
    this.assert(o.c[0] === null, "failure 10");
  })

], {
  setUp: function() {
    this.e = TJP.base.urlencode;
    this.d = TJP.base.urldecode;
  },
  tearDown: function() {
    delete this.e;
    delete this.d;
  }
});

baseSuite.addChild(urlencodingSuite);
