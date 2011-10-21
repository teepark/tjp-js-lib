/*global TJP,print,readline*/

TJP.spidermonkey = TJP.spidermonkey || {};

TJP.spidermonkey.stdin = {
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

TJP.spidermonkey.stdout = {
  'write': print,
  'writeline': print
};
