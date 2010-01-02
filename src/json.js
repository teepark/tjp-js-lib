/*
json - a complete serializer and deserializer for JSON

json.load(datastring)
json.decode(datastring)
json.parse(datastring)
  returns a javascript object deserialized from the JSON string

json.dump(obj)
json.encode(obj)
  returns a string of JSON that represents the object
*/

/*global TJP*/
//context:browser
//context:console

var
  DOUBLE_QUOTE = 1,
  SINGLE_QUOTE = 2,
  OTHER = 8,
  BACKSLASH = 9,
  //////////////
  OPEN_BRACKET = 3,
  CLOSE_BRACKET = 4,
  OPEN_BRACE = 5,
  CLOSE_BRACE = 6,
  COMMA = 7,
  COLON = 10,
  //////////////
  STRING = 11,
  NUMBER = 12,
  TRUE = 13,
  FALSE = 14,
  NULL = 15,
  UNDEFINED = 16,
  INFINITY = 17,
  NEGATIVE_INFINITY = 18,
  IDENTIFIER = 19;

/* comment this out for production
var ltrim_regex = RegExp('^\\s\\s*'),
    space_regex = RegExp('\\s');
var TJP = TJP || {
  base: {
    trim: function(str) {
      var i;
      str = str.replace(ltrim_regex, '');
      i = str.length;
      while (space_regex.test(str.charAt(--i)));
      return str.slice(0, i + 1);
    }
  }
};

var rev = {};
rev[DOUBLE_QUOTE] = 'DOUBLE_QUOTE';
rev[SINGLE_QUOTE] = 'SINGLE_QUOTE';
rev[OPEN_BRACKET] = 'OPEN_BRACKET';
rev[CLOSE_BRACKET] = 'CLOSE_BRACKET';
rev[OPEN_BRACE] = 'OPEN_BRACE';
rev[CLOSE_BRACE] = 'CLOSE_BRACE';
rev[COMMA] = 'COMMA';
rev[OTHER] = 'OTHER';
rev[BACKSLASH] = 'BACKSLASH';
rev[COLON] = 'COLON';
rev[STRING] = 'STRING';
rev[NUMBER] = 'NUMBER';
rev[TRUE] = 'TRUE';
rev[FALSE] = 'FALSE';
rev[NULL] = 'NULL';
rev[UNDEFINED] = 'UNDEFINED';
rev[INFINITY] = 'INFINITY';
rev[NEGATIVE_INFINITY] = 'NEGATIVE_INFINITY';
rev[IDENTIFIER] = 'IDENTIFIER';

function show(tokens) {
  var i, j, token, spaces;
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    for (spaces = [], j = rev[token[0]].length; j <= 17; j++) spaces.push(' ');
    print(rev[token[0]] + spaces.join('') + token[1]);
  }
};
*/

TJP.json = TJP.json || {};

var CHAR_TOKENS = {
  '"': DOUBLE_QUOTE,
  "'": SINGLE_QUOTE,
  '[': OPEN_BRACKET,
  ']': CLOSE_BRACKET,
  '{': OPEN_BRACE,
  '}': CLOSE_BRACE,
  ',': COMMA,
  '\\': BACKSLASH,
  ':': COLON
};

var REMOVE_SLASHES = {
  'n': '\n',
  'r': '\r',
  't': '\t',
  'b': '\b',
  'f': '\f'
};

function tokenize(data) {
  var i, ch, tokens = [], buffer = [], token;

  for (i = 0; i < data.length; i++) {
    ch = data[i];
    token = CHAR_TOKENS[ch];
    if (token) {
      if (buffer.length) {
        tokens.push([OTHER, buffer.join('')]);
        buffer = [];
      }
      tokens.push([token, ch]);
    } else buffer.push(ch);
  }
  if (buffer.length) tokens.push([OTHER, buffer.join('')]);

  return tokens;
};

var number_regex = /^-?((\d+(\.(\d+)?)?)|(\.\d+))([eE]-?\d+)?$/;

function reduce_tokens(tokens) {
  var i, token, next, replacement, buffer, instr, val, strtype;

  // scan for BACKSLASHes and replace as necessary
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    if (token[0] === BACKSLASH) {
      next = tokens[i + 1];
      switch(next[0]) {
        case BACKSLASH:
          tokens.splice(i, 2, [OTHER, '\\\\']);
          break;
        case OTHER:
          replacement = REMOVE_SLASHES[next[1].slice(0, 1)];
          if (replacement)
            tokens.splice(i, 2, [OTHER, replacement + next[1].slice(1)]);
          else tokens.splice(i--, 1);
          break;
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          // this is the only case in which we keep the BACKSLASH token
          break;
        default:
          throw new Error("Bad context for a \\");
      }
    }
  }

  // combine adjacent OTHER tokens
  for (i = 0; i < tokens.length; i++) {
    if (tokens[i][0] === OTHER && tokens[i + 1] &&
        tokens[i + 1][0] === OTHER)
      tokens.splice(i, 2, [OTHER, tokens[i][1] + tokens[i + 1][1]]);
  }

  // find STRINGs
  for (i = 0, buffer = [], instr = false; i < tokens.length; i++) {
    token = tokens[i];
    if (token[0] === SINGLE_QUOTE || token[0] === DOUBLE_QUOTE) {
      if (instr) {
        if (tokens[i - 1] && tokens[i - 1][0] === BACKSLASH) {
          buffer.push(token[1]);
          tokens.splice(--i, 2);
          continue;
        } else if (token[0] !== strtype) {
          buffer.push(token[1]);
          tokens.splice(i--, 1);
          continue;
        }
        else {
          tokens.splice(i, 1, [STRING, buffer.join('')]);
          buffer = [];
        }
      }  else {
        strtype = token[0];
        tokens.splice(i--, 1);
      }
      instr = !instr;
    } else if (instr) {
      buffer.push(token[1]);
      tokens.splice(i--, 1);
    }
  }

  // trim whitespace and identify the OTHERs
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    if (token[0] === OTHER) {
      val = TJP.base.trim(token[1]);
      if (!val) tokens.splice(i, 1);
      else {
        token[1] = val;
        if (val === "true") token[0] = TRUE;
        else if (val === "false") token[0] = FALSE;
        else if (val === "null") token[0] = NULL;
        else if (val === "undefined") token[0] = UNDEFINED;
        else if (val === "Infinity") token[0] = INFINITY;
        else if (val === "-Infinity") token[0] = NEGATIVE_INFINITY;
        else if (number_regex.test(val))
          token[0] = NUMBER;
        else token[0] = IDENTIFIER;
      }
    }
  }
};

function apply_value(stack, value) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_BRACE) {
    if (stacktop.postcolon) {
      stacktop.obj[stacktop.key] = value;
      stacktop.postcolon = false;
    } else throw new Error("Bad syntax");
  } else if (stacktop.type === OPEN_BRACKET) {
    if (stacktop.postcomma || stacktop.juststarted) {
      stacktop.obj.push(value);
      stacktop.postcomma = stacktop.juststarted = false;
    } else throw new Error("Bad syntax");
  } else throw new Error("Parser Error");
};

function find_matching(opener, closer, tokens) {
  var i, token, count = 1;
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i][0];
    if (token === opener) count++;
    else if (token === closer) count--;
    if (!count) return i;
  }
  throw new Error("No matching '" + closer + "' found");
};

function parse_open_straight(stack, token) {
  stack.push({
    type: OPEN_BRACKET,
    obj: [],
    postcomma: false,
    juststarted: true
  });
};

function parse_close_straight(stack, token) {
  var stacktop = stack[stack.length - 1], arr;
  if (stacktop.type !== OPEN_BRACKET) throw new Error("mismatched ']'");
  arr = stack.pop().obj;
  stacktop = stack[stack.length - 1];
  switch(stacktop.type) {
    case OPEN_BRACE:
      stacktop.obj[stacktop.key] = arr;
      break;
    case OPEN_BRACKET:
      stacktop.obj.push(arr);
      break;
    default:
      throw new Error("bad context for an array");
  }
};

function parse_open_curly(stack, token) {
  stack.push({
    type: OPEN_BRACE,
    obj: {},
    key: '',
    postcomma: false,
    postcolon: false,
    juststarted: true
  });
};

function parse_close_curly(stack, token) {
  var stacktop = stack[stack.length - 1], arr, obj;
  if (stacktop.type !== OPEN_BRACE) throw new Error("mismatched ']'");
  obj = stack.pop().obj;
  stacktop = stack[stack.length - 1];
  switch(stacktop.type) {
    case OPEN_BRACE:
      stacktop.obj[stacktop.key] = obj;
      break;
    case OPEN_BRACKET:
      stacktop.obj.push(obj);
      break;
    default:
      throw new Error("bad context for an array");
  }
};

function parse_identifier(stack, token) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_BRACE &&
      (stacktop.postcomma || stacktop.juststarted)) {
    stacktop.key = token[1];
    stacktop.postcomma = stacktop.juststarted = false;
  } else throw new Error("Bad syntax");
};

function parse_comma(stack, token) {
  var stacktop = stack[stack.length - 1];
  stacktop.postcomma = true;
};

function parse_colon(stack, token) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type !== OPEN_BRACE) throw new Error("bad context for a COLON");
  stacktop.postcolon = true;
};

function parse_string(stack, token) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_BRACE &&
      (stacktop.postcomma || stacktop.juststarted)) {
    stacktop.key = token[1];
    stacktop.postcomma = stacktop.juststarted = false;
  } else apply_value(stack, token[1]);
};

function parse_number(stack, token) {
  apply_value(stack, eval(token[1]));
};

var simple_values = {};
simple_values[TRUE] = true;
simple_values[FALSE] = false;
simple_values[UNDEFINED] = undefined;
simple_values[NULL] = null;
simple_values[INFINITY] = Infinity;
simple_values[NEGATIVE_INFINITY] = -Infinity;

function parse_simple_value(stack, token) {
  apply_value(stack, simple_values[token[0]]);
};

var parsers = {};
parsers[OPEN_BRACKET] = parse_open_straight;
parsers[CLOSE_BRACKET] = parse_close_straight;
parsers[OPEN_BRACE] = parse_open_curly;
parsers[CLOSE_BRACE] = parse_close_curly;
parsers[COMMA] = parse_comma;
parsers[COLON] = parse_colon;
parsers[STRING] = parse_string;
parsers[NUMBER] = parse_number;
parsers[NEGATIVE_INFINITY] = parsers[NULL] = parse_simple_value;
parsers[UNDEFINED] = parsers[INFINITY] = parse_simple_value;
parsers[TRUE] = parsers[FALSE] = parse_simple_value;
parsers[IDENTIFIER] = parse_identifier;

function parse_tokens(tokens) {
  var stack = [{
    type: OPEN_BRACKET,
    obj: [],
    postcomma: false,
    juststarted: true
  }], token;
  while (tokens.length) {
    token = tokens.shift();
    parsers[token[0]](stack, token);
  }
  return stack[0].obj[0];
};

TJP.json.load = TJP.json.decode = TJP.json.parse = function(data) {
  var tokens = tokenize(data);
  reduce_tokens(tokens);
  return parse_tokens(tokens);
};

function dump_array(arr) {
  var dumped = [], i;
  for (i = 0; i < arr.length; i++) {
    dumped.push(TJP.json.dump(arr[i]));
  }
  return "[" + dumped.join(',') + "]";
};

var ADD_SLASHES = {
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\b": "\\b",
  "\f": "\\f",
  '"': '\\"'
};

function dump_string(str) {
  var from;
  str = str.replace('\\', '\\\\', 'g');
  for (from in ADD_SLASHES) str = str.replace(from, ADD_SLASHES[from], 'g');
  return '"' + str + '"';
};

function dump_object(obj) {
  var dumped = [], name;
  for (name in obj) {
    dumped.push(dump_string(name) + ":" + TJP.json.dump(obj[name]));
  }
  return "{" + dumped.join(',') + "}";
};

TJP.json.dump = TJP.json.encode = function(data) {
  var type = TJP.base.getType(data);
  switch(type) {
    case "number":
    case "boolean":
      return data.toString();
    case "string":
      return dump_string(data);
    case "undefined":
    case "NaN":
    case "null":
      return type;
    case "array":
      return dump_array(data);
    case "object":
      return dump_object(data);
    case "date":
    case "regexp":
    case "function":
    default:
      throw new Error("can't serialize a " + type);
  }
};
