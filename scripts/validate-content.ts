/**
 * CLI wrapper around the content validator. Exits non-zero on any error so it
 * can gate a build or CI run.
 */

import { content } from '../src/content';
import { validateContent } from '../src/content/validate';

const issues = validateContent(content);
const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');

for (const issue of issues) {
  const where = issue.node ? ` [${issue.node}]` : '';
  const line = `${issue.severity.toUpperCase()}${where} ${issue.message}`;
  if (issue.severity === 'error') console.error(line);
  else console.warn(line);
}

const nodeCount = Object.keys(content.nodes).length;
const choiceCount = Object.values(content.nodes).reduce((sum, n) => sum + n.choices.length, 0);

console.log(
  `\n${nodeCount} nodes, ${choiceCount} choices, ` +
    `${Object.keys(content.companions).length} companions, ` +
    `${Object.keys(content.perks).length} perks, ` +
    `${Object.keys(content.endings).length} endings`,
);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);

process.exit(errors.length > 0 ? 1 : 0);
