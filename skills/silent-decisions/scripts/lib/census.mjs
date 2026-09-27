// Decision-point census: enumerate the syntactic places where implementers make
// silent decisions. Deterministic; reads the clean-room copy so line numbers match
// what the extractor sees (and, because stripping keeps newlines, the original too).
import fs from 'node:fs';
import path from 'node:path';
import { loadTypescript, normalizeWs } from './util.mjs';

const ROUNDING = new Set(['round', 'floor', 'ceil', 'trunc', 'toFixed', 'toPrecision']);
const TIME = new Set(['now', 'getTimezoneOffset', 'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString',
  'setHours', 'setUTCHours', 'getUTCDay', 'getDay', 'getUTCHours', 'getHours', 'toISOString']);
const TRIVIAL_NUMBERS = new Set(['0', '1']);

export function takeCensus({ proj, cleanroomDir, files }) {
  const ts = loadTypescript(proj);
  const SK = ts.SyntaxKind;
  const comparison = new Set([SK.LessThanToken, SK.LessThanEqualsToken, SK.GreaterThanToken, SK.GreaterThanEqualsToken,
    SK.EqualsEqualsToken, SK.EqualsEqualsEqualsToken, SK.ExclamationEqualsToken, SK.ExclamationEqualsEqualsToken]);
  const defaulting = new Set([SK.QuestionQuestionToken, SK.BarBarToken, SK.QuestionQuestionEqualsToken, SK.BarBarEqualsToken]);
  const items = [];

  for (const file of files) {
    const abs = path.join(cleanroomDir, file);
    const text = fs.readFileSync(abs, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const push = (kind, node, note) => {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      let snippet = normalizeWs(node.getText(sf));
      if (snippet.length > 160) snippet = snippet.slice(0, 157) + '...';
      items.push({ kind, file, line: line + 1, text: snippet, ...(note ? { note } : {}) });
    };
    const isLiteral = (n) => ts.isNumericLiteral(n) || ts.isStringLiteralLike(n) || n.kind === SK.TrueKeyword
      || n.kind === SK.FalseKeyword || n.kind === SK.NullKeyword
      || (ts.isPrefixUnaryExpression(n) && ts.isNumericLiteral(n.operand));

    // `covered` means an enclosing node was already recorded, so inner literals and
    // comparisons are part of that decision and are not listed again.
    const visit = (node, covered) => {
      let here = covered;
      if (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isWhileStatement(node)) {
        const cond = ts.isConditionalExpression(node) ? node.condition : node.expression;
        if (!covered) push('condition', cond);
        visit(cond, true);
        ts.forEachChild(node, (c) => { if (c !== cond) visit(c, covered); });
        return;
      }
      if (ts.isSwitchStatement(node)) {
        if (!covered) push('branch', node.expression, `${node.caseBlock.clauses.length} cases`);
        for (const clause of node.caseBlock.clauses) {
          if (ts.isCaseClause(clause)) push('case', clause.expression);
          clause.statements.forEach((s) => visit(s, covered));
        }
        return;
      }
      if (ts.isThrowStatement(node)) { push('rejection', node); here = true; }
      else if (ts.isBinaryExpression(node) && comparison.has(node.operatorToken.kind)) {
        if (!covered) push('comparison', node); here = true;
      } else if (ts.isBinaryExpression(node) && defaulting.has(node.operatorToken.kind) && isLiteral(node.right)) {
        if (!covered) push('default', node); here = true;
      } else if (ts.isParameter(node) && node.initializer) { push('default', node); here = true; }
      else if ((ts.isPropertyDeclaration(node) || ts.isBindingElement(node)) && node.initializer && isLiteral(node.initializer)) {
        push('default', node); here = true;
      } else if (ts.isVariableDeclaration(node) && node.initializer && isLiteral(node.initializer)
        && ts.isIdentifier(node.name) && /^[A-Z][A-Z0-9_]+$/.test(node.name.text)) {
        push('constant', node); here = true;
      } else if (ts.isEnumDeclaration(node)) { push('enum', node); here = true; }
      else if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)
        && node.type.types.every((t) => ts.isLiteralTypeNode(t))) { push('enum', node); here = true; }
      else if (node.kind === SK.RegularExpressionLiteral) { push('validation', node); }
      else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const name = node.expression.name.text;
        if (name === 'sort' || name === 'toSorted') { push('ordering', node); }
        else if (ROUNDING.has(name)) { push('rounding', node); here = true; }
        else if (TIME.has(name)) { push('time', node); }
      } else if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Date') {
        push('time', node);
      } else if (ts.isNumericLiteral(node) && !covered && !TRIVIAL_NUMBERS.has(node.text)) {
        // A bare number that no recorded decision encloses (array index arithmetic, limits in calls, ...).
        if (!ts.isEnumMember(node.parent) && !ts.isLiteralTypeNode(node.parent)) push('literal', node.parent && !ts.isSourceFile(node.parent) ? node.parent : node);
      }
      ts.forEachChild(node, (c) => visit(c, here));
    };
    visit(sf, false);
  }

  items.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return items.map((it, i) => ({ id: `C-${String(i + 1).padStart(3, '0')}`, ...it }));
}
