/*global tjp,print,readline*/
//context:console

tjp.spidermonkey = {};

tjp.spidermonkey.stdin = {
  'read': function() {
    var lines = [], line;
    while (1) {
      line = readline();
      if (line === null) break;
      lines.push(line);
    }
    return lines.join("\n");
  },
  'readline': readline
};

tjp.spidermonkey.stdout = {
  'write': print,
  'writeline': print
};
