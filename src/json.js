

var tjp;
tjp = tjp || {
  base: {
    trim: function(str) {
      var i, ws = /\s/;
      str = str.replace(/^\s\s*/, '');
      i = str.length;
      while (ws.test(str.charAt(--i)));
      return str.slice(0, i + 1);
    },
    assert: function(boolval, message) {
      if (!boolval) throw new Error(message);
    }
  }
};

tjp.json = {};

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

var rev = [null,
  'DOUBLE_QUOTE',
  'SINGLE_QUOTE',
  'OPEN_STRAIGHT',
  'CLOSE_STRAIGHT',
  'OPEN_CURLY',
  'CLOSE_CURLY',
  'COMMA',
  'OTHER',
  'BACKSLASH',
  'COLON',
  'STRING',
  'NUMBER',
  'TRUE',
  'FALSE',
  'NULL',
  'UNDEFINED',
  'INFINITY',
  'NEGATIVE_INFINITY',
  'IDENTIFIER'
];

function show(tokens) {
  for (var i = 0; i < tokens.length; i++) {
    print(rev[tokens[i][0]] + ": " + tokens[i][1]);
  }
};

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
  var state = {
    'stack': [],
    'postcomma': false,
  };

};

function parse_open_straight(state, token) {
  state.stack.push([OPEN_STRAIGHT, []]);
};

function parse_open_curly(state, token) {
  state.stack.push([OPEN_CURLY, {}, '']);
};

function parse_string(token, state) {
  var stacktop = state.stack[stack.length - 1];
  switch (stacktop[0]) {
    case OPEN_CURLY:
      if (state.postcomma) {
        stacktop[1][stacktop[2]] = token[1];
        state.postcomma = false;
      } else stacktop[2] = token[1];
      break;
    case OPEN_STRAIGHT:
      stacktop[1].push(token[1]);
      state.postcomma = false;
      break;
    case default:
      throw new Error("bad context for a STRING");
  }
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
  
};

tjp.json.dump = tjp.json.encode = function(data) {

};
