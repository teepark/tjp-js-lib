var
  DOUBLE_QUOTE = 1,
  SINGLE_QUOTE = 2,
  OPEN_STRAIGHT = 3,
  CLOSE_STRAIGHT = 4,
  OPEN_CURLY = 5,
  CLOSE_CURLY = 6,
  COMMA = 7,
  OTHER = 8,
  BACKSLASH = 9,
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

var CHAR_TOKENS = {
  '"': DOUBLE_QUOTE,
  "'": SINGLE_QUOTE,
  '[': OPEN_STRAIGHT,
  ']': CLOSE_STRAIGHT,
  '{': OPEN_CURLY,
  '}': CLOSE_CURLY,
  ',': COMMA,
  '\\': BACKSLASH,
  ':': COLON
};

var REPLACEMENTS = {
  'n': '\n',
  'r': '\r',
  't': '\t',
  'b': '\b',
  'f': '\f'
};

function tokenize(data) {
  var i, ch, tokens = [], buffer = [];

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

function reduce_tokens(tokens) {
  var i, j, token, next, replacement, buffer, instr, val;

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
          replacement = REPLACEMENTS[next[1].slice(0, 1)];
          if (replacement)
            tokens.splice(i, 2, [OTHER, replacement + next[1].slice(1)]);
          else tokens.splice(i--, 1);
          break;
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          // the only case in which we keep the BACKSLASH token
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
      tokens.splice(i, 2, [OTHER, tokens[i][0] + tokens[i + 1][0]]);
  }

  // find STRINGs
  for (i = j = 0, buffer = [], instr = false; i < tokens.length; i++) {
    token = tokens[i];
    if (token[0] === SINGLE_QUOTE || token[0] === DOUBLE_QUOTE) {
      if (instr) {
        if (tokens[i - 1] && tokens[i - 1][0] === BACKSLASH) {
          buffer.push(token[1]);
          j++;
          continue;
        } else if (token[0] !== strtype) tokens.splice(i, 1);
        else {
          tokens.splice(i - j - 1, j + 2, [STRING, buffer.join('')]);
          buffer = [];
          j = 0;
        }
      } else strtype = token[0];
      instr = !instr;
    } else if (instr) {
      buffer.push(token[1]);
      j++;
    }
  }

  // trim whitespace and identify the OTHERs
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    if (token[0] === OTHER) {
      val = tjp.base.trim(token[1]);
      if (!val) tokens.splice(i, 1);
      else {
        token[1] = val;
        if (val === "true") token[0] = TRUE;
        else if (val === "false") token[0] = FALSE;
        else if (val === "null") token[0] = NULL;
        else if (val === "undefined") token[0] = UNDEFINED;
        else if (val === "Infinity") token[0] = INFINITY;
        else if (val === "-Infinity") token[0] = NEGATIVE_INFINITY;
        else if (val.match(/^-?((\d+(\.(\d+)?)?)|(\.\d+))([eE]-?\d+)?$/))
          token[0] = NUMBER;
        else token[0] = IDENTIFIER;
      }
    }
  }
};

function parse_tokens(tokens) {
  var stack = [{
    type: OPEN_STRAIGHT,
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

var parsers = {};
parsers[OPEN_STRAIGHT] = parse_open_straight;
parsers[CLOSE_STRAIGHT] = parse_close_straight;
parsers[OPEN_CURLY] = parse_open_curly;
parsers[CLOSE_CURLY] = parse_close_curly;
parsers[COMMA] = parse_comma;
parsers[COLON] = parse_colon;
parsers[STRING] = parse_string;
parsers[NUMBER] = parse_number;
parsers[NEGATIVE_INFINITY] = parsers[NULL] = parse_simple_value;
parsers[UNDEFINED] = parsers[INFINITY] = parse_simple_value;
parsers[TRUE] = parsers[FALSE] = parse_simple_value;
parsers[IDENTIFIER] = parse_identifier;

function apply_value(stack, value) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_CURLY) {
    if (stacktop.postcolon) {
      stacktop.obj[stacktop.key] = value;
      stacktop.postcolon = false;
    } else throw new Error("Bad syntax");
  } else if (stacktop.type === OPEN_STRAIGHT) {
    if (stacktop.postcomma || stacktop.juststarted) {
      stacktop.obj.push(value);
      stacktop.postcomma = stacktop.juststarted = false;
    } else throw new Error("Bad syntax");
  } else throw new Error("Parser Error");
};

function parse_open_straight(stack, token) {
  stack.push({
    type: OPEN_STRAIGHT,
    obj: [],
    postcomma: false,
    juststarted: true
  });
};

function parse_close_straight(stack, token) {
  var stacktop = stack[stack.length - 1], arr;
  if (stacktop.type !== OPEN_STRAIGHT) throw new Error("mismatched ']'");
  arr = stack.pop().obj;
  stacktop = stack[stack.length - 1];
  switch(stacktop.type) {
    case OPEN_CURLY:
      stacktop.obj[stacktop.key] = arr;
      break;
    case OPEN_STRAIGHT:
      stacktop.obj.push(arr);
      break;
    default:
      throw new Error("bad context for an array");
  }
};

function parse_open_curly(stack, token) {
  stack.push({
    type: OPEN_CURLY,
    obj: {},
    key: '',
    postcomma: false,
    postcolon: false,
    juststarted: true
  });
};

function parse_close_curly(stack, token) {
  var stacktop = stack[stack.length - 1], arr;
  if (stacktop.type !== OPEN_CURLY) throw new Error("mismatched ']'");
  obj = stack.pop().obj;
  stacktop = stack[stack.length - 1];
  switch(stacktop.type) {
    case OPEN_CURLY:
      stacktop.obj[stacktop.key] = obj;
      break;
    case OPEN_STRAIGHT:
      stacktop.obj.push(obj);
      break;
    default:
      throw new Error("bad context for an array");
  }
};

function parse_identifier(stack, token) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_CURLY &&
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
  if (stacktop.type !== OPEN_CURLY) throw new Error("bad context for a COLON");
  stacktop.postcolon = true;
};

function parse_string(stack, token) {
  var stacktop = stack[stack.length - 1];
  if (stacktop.type === OPEN_CURLY &&
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

function find_matching(opener, closer, tokens) {
  var i, token, count = 1;

  for (i = 0; i < tokens.length; i++) {
    token = tokens[i][0];
    if (token === opener) count++;
    else if (token == closer) count--;
    if (!count) return i;
  }
  throw new Error("No matching '" + closer + "' found");
};

tjp.json.load = tjp.json.decode = function(data) {
  var tokens = tokenize(data);
  reduce_tokens(tokens);
  return parse_tokens(tokens);
};

tjp.json.dump = tjp.json.encode = function(data) {

};
