

var t = TJP.test;


var bisectSuite = t.suite([], {
  setUp: function() { this.b = TJP.bisect; },
  tearDown: function() { delete this.b; }
});


var bisectingSearchSuite = t.suite([

  t.test(function() {
    
  })

], {
  setUp: function() {
    this.r = this.b.bisect_right;
    this.l = this.b.bisect_left;
  },
  tearDown: function() {
    delete this.r;
    delete this.l;
  }
});
