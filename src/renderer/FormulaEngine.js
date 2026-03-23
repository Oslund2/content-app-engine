// FormulaEngine.js
// Safe arithmetic expression evaluator for config-driven story renderer.
// Tokenizer + recursive-descent parser. No eval(), no Function(), no codegen.

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const TokenType = Object.freeze({
  NUMBER: 'NUMBER',
  IDENT: 'IDENT',     // dot-path variable reference
  PLUS: '+',
  MINUS: '-',
  STAR: '*',
  SLASH: '/',
  LPAREN: '(',
  RPAREN: ')',
  EOF: 'EOF',
});

const WHITESPACE = /\s/;
const DIGIT = /[0-9]/;
const IDENT_START = /[a-zA-Z_]/;
const IDENT_CHAR = /[a-zA-Z0-9_.]/;

function tokenize(formula) {
  const tokens = [];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    // Skip whitespace
    if (WHITESPACE.test(ch)) {
      i++;
      continue;
    }

    // Single-character operators / parens
    if (ch === '+') { tokens.push({ type: TokenType.PLUS, value: '+' }); i++; continue; }
    if (ch === '-') { tokens.push({ type: TokenType.MINUS, value: '-' }); i++; continue; }
    if (ch === '*') { tokens.push({ type: TokenType.STAR, value: '*' }); i++; continue; }
    if (ch === '/') { tokens.push({ type: TokenType.SLASH, value: '/' }); i++; continue; }
    if (ch === '(') { tokens.push({ type: TokenType.LPAREN, value: '(' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: TokenType.RPAREN, value: ')' }); i++; continue; }

    // Number literals (integer or float)
    if (DIGIT.test(ch)) {
      let num = '';
      while (i < formula.length && DIGIT.test(formula[i])) { num += formula[i]; i++; }
      if (i < formula.length && formula[i] === '.') {
        num += '.'; i++;
        while (i < formula.length && DIGIT.test(formula[i])) { num += formula[i]; i++; }
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Dot-path identifiers  (e.g. inputs.origin.data.miles)
    if (IDENT_START.test(ch)) {
      let ident = '';
      while (i < formula.length && IDENT_CHAR.test(formula[i])) { ident += formula[i]; i++; }
      tokens.push({ type: TokenType.IDENT, value: ident });
      continue;
    }

    // Anything else is an illegal token
    throw new Error(`FormulaEngine: unexpected character '${ch}' in formula "${formula}"`);
  }

  tokens.push({ type: TokenType.EOF, value: null });
  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive-descent parser  (expr -> term -> factor -> atom)
//
//   expr   = term (('+' | '-') term)*
//   term   = factor (('*' | '/') factor)*
//   factor = ('+' | '-') factor | atom
//   atom   = NUMBER | IDENT | '(' expr ')'
// ---------------------------------------------------------------------------

function parse(tokens, context) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function advance() { return tokens[pos++]; }

  function expr() {
    let left = term();
    while (peek().type === TokenType.PLUS || peek().type === TokenType.MINUS) {
      const op = advance();
      const right = term();
      left = op.type === TokenType.PLUS ? left + right : left - right;
    }
    return left;
  }

  function term() {
    let left = factor();
    while (peek().type === TokenType.STAR || peek().type === TokenType.SLASH) {
      const op = advance();
      const right = factor();
      left = op.type === TokenType.STAR ? left * right : left / right;
    }
    return left;
  }

  function factor() {
    // Unary plus / minus
    if (peek().type === TokenType.PLUS) {
      advance();
      return +factor();
    }
    if (peek().type === TokenType.MINUS) {
      advance();
      return -factor();
    }
    return atom();
  }

  function atom() {
    const tok = peek();

    if (tok.type === TokenType.NUMBER) {
      advance();
      return tok.value;
    }

    if (tok.type === TokenType.IDENT) {
      advance();
      const resolved = resolvePath(tok.value, context);
      const num = Number(resolved);
      return Number.isFinite(num) ? num : NaN;
    }

    if (tok.type === TokenType.LPAREN) {
      advance(); // consume '('
      const val = expr();
      if (peek().type !== TokenType.RPAREN) {
        throw new Error('FormulaEngine: missing closing parenthesis');
      }
      advance(); // consume ')'
      return val;
    }

    throw new Error(`FormulaEngine: unexpected token ${tok.type} ("${tok.value}")`);
  }

  const result = expr();

  if (peek().type !== TokenType.EOF) {
    throw new Error(`FormulaEngine: unexpected trailing token ${peek().type}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-path like "inputs.origin.data.miles" from the context object.
 * @param {string} path
 * @param {object} context
 * @returns {*} - the resolved value, or undefined if any segment is missing
 */
export function resolvePath(path, context) {
  if (path == null || context == null) return undefined;
  const segments = String(path).split('.');
  let current = context;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[seg];
  }
  return current;
}

/**
 * Evaluate a single formula string against a context object.
 * @param {string} formula - e.g. "inputs.origin.data.newMin - inputs.origin.data.oldMin"
 * @param {object} context - { inputs: {...}, calculations: {...} }
 * @returns {number} - computed result or NaN
 */
export function evaluate(formula, context) {
  if (typeof formula !== 'string' || formula.trim() === '') return NaN;
  try {
    const tokens = tokenize(formula);
    return parse(tokens, context);
  } catch {
    return NaN;
  }
}

/**
 * Run all calculations defined in a config, resolving dependencies in order.
 * Each calcDef is evaluated sequentially so that later formulas can reference
 * earlier results via "calculations.<id>".
 *
 * @param {Array} calcDefs - [{ id, formula, format }]
 * @param {object} inputState - current input values
 * @returns {object} - { calcId: computedValue, ... }
 */
export function runCalculations(calcDefs, inputState) {
  const context = {
    inputs: inputState ?? {},
    calculations: {},
  };

  if (!Array.isArray(calcDefs)) return context.calculations;

  for (const def of calcDefs) {
    if (!def || typeof def.id !== 'string') continue;
    const value = evaluate(def.formula, context);
    context.calculations[def.id] = value;
  }

  return context.calculations;
}

/**
 * Format a number according to a format spec.
 * @param {number} value
 * @param {string} format - "currency"|"round"|"percent"|"decimal1"|"compact"
 * @returns {string}
 */
export function formatValue(value, format) {
  if (!Number.isFinite(value)) return String(value); // "NaN", "Infinity", etc.

  switch (format) {
    case 'currency':
      return '$' + Math.round(value).toLocaleString('en-US');

    case 'round':
      return Math.round(value).toLocaleString('en-US');

    case 'percent':
      return Math.round(value) + '%';

    case 'decimal1':
      return value.toFixed(1);

    case 'compact': {
      const abs = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
      return String(value);
    }

    default:
      return String(value);
  }
}
