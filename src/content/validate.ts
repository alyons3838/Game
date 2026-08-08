/**
 * Content integrity checks.
 *
 * The previous version of this game shipped with choices pointing at nodes that
 * were never written, so the story dead-ended a few clicks in. This module makes
 * that class of bug impossible to ship: it walks the whole graph and fails the
 * build on any unreachable or dangling reference.
 *
 * Run via `npm run lint:content`, and enforced by the test suite.
 */

import { hubNodeId } from '@/engine/engine';
import type { Condition, Effect, StoryContent, StoryNode } from '@/engine/types';
import { FACTION_IDS, RESOURCE_IDS, STAT_IDS } from '@/engine/types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  node?: string;
  message: string;
}

const DYNAMIC_TARGETS = new Set(['@hub', '@encounter']);

export function validateContent(content: StoryContent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(Object.keys(content.nodes));

  const err = (message: string, node?: string) =>
    issues.push({ severity: 'error', message, ...(node ? { node } : {}) });
  const warn = (message: string, node?: string) =>
    issues.push({ severity: 'warning', message, ...(node ? { node } : {}) });

  const checkTarget = (target: string | undefined, nodeId: string, label: string) => {
    if (!target) {
      err(`${label} has no destination`, nodeId);
      return;
    }
    if (DYNAMIC_TARGETS.has(target)) return;
    if (!nodeIds.has(target)) err(`${label} points at missing node "${target}"`, nodeId);
  };

  // --- Per-node checks -----------------------------------------------------
  const choiceIds = new Set<string>();

  for (const node of Object.values(content.nodes)) {
    if (node.body.length === 0) err('Node has no body text', node.id);

    if (node.ending) {
      if (!content.endings[node.ending]) {
        err(`Ending "${node.ending}" is not defined`, node.id);
      }
      if (node.choices.length > 0) {
        err('Terminal node must have no choices', node.id);
      }
    } else if (node.choices.length === 0) {
      err('Non-terminal node has no choices — the run would dead-end here', node.id);
    }

    if (node.location && !content.locations[node.location]) {
      err(`References missing location "${node.location}"`, node.id);
    }

    for (const effect of node.onEnter ?? []) {
      checkEffect(effect, content, node.id, err);
    }

    for (const choice of node.choices) {
      if (choiceIds.has(choice.id)) {
        err(`Duplicate choice id "${choice.id}"`, node.id);
      }
      choiceIds.add(choice.id);

      if (choice.roll) {
        checkTarget(choice.roll.success, node.id, `Choice "${choice.id}" success branch`);
        checkTarget(choice.roll.failure, node.id, `Choice "${choice.id}" failure branch`);
        if (choice.roll.dc < 1 || choice.roll.dc > 145) {
          warn(`Choice "${choice.id}" has an unreachable DC of ${choice.roll.dc}`, node.id);
        }
      } else {
        checkTarget(choice.goto, node.id, `Choice "${choice.id}"`);
      }

      for (const effect of choice.effects ?? []) {
        checkEffect(effect, content, node.id, err);
      }
      if (choice.requires) checkCondition(choice.requires, content, node.id, err);
    }

    if (node.encounter) {
      if (node.encounter.weight <= 0) {
        warn('Encounter has non-positive weight and can never be selected', node.id);
      }
      for (const locationId of node.encounter.location ?? []) {
        if (!content.locations[locationId]) {
          err(`Encounter gated on missing location "${locationId}"`, node.id);
        }
      }
      if (node.encounter.requires) {
        checkCondition(node.encounter.requires, content, node.id, err);
      }
    }
  }

  // --- Structural checks ---------------------------------------------------
  for (const location of Object.values(content.locations)) {
    const hub = hubNodeId(location.id);
    if (!nodeIds.has(hub)) {
      err(`Location "${location.id}" has no hub node ("${hub}")`);
    }
    if (location.arrival && !nodeIds.has(location.arrival)) {
      err(`Location "${location.id}" arrival node "${location.arrival}" is missing`);
    }
  }

  for (const companion of Object.values(content.companions)) {
    if (!content.locations[companion.location]) {
      err(`Companion "${companion.id}" is located at missing location "${companion.location}"`);
    }
    if (companion.perk && !content.perks[companion.perk]) {
      err(`Companion "${companion.id}" grants missing perk "${companion.perk}"`);
    }
  }

  // Every ending must be reachable from some node.
  const reachableEndings = new Set(
    Object.values(content.nodes)
      .map((n) => n.ending)
      .filter((e): e is string => Boolean(e)),
  );
  for (const ending of Object.keys(content.endings)) {
    if (!reachableEndings.has(ending)) {
      err(`Ending "${ending}" has no node that awards it`);
    }
  }

  issues.push(...checkReachability(content));
  return issues;
}

/**
 * Walks the graph from every location arrival node plus every hub, following
 * static targets and expanding the dynamic ones. Anything never reached is
 * orphaned content — usually a typo in a `goto`.
 */
function checkReachability(content: StoryContent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const queue: string[] = [];

  const push = (id: string) => {
    if (!seen.has(id) && content.nodes[id]) {
      seen.add(id);
      queue.push(id);
    }
  };

  for (const location of Object.values(content.locations)) {
    push(hubNodeId(location.id));
    if (location.arrival) push(location.arrival);
  }
  // Encounters are reached via `@encounter` rather than a static edge.
  for (const node of Object.values(content.nodes)) {
    if (node.encounter) push(node.id);
  }

  while (queue.length) {
    const node = content.nodes[queue.pop()!]!;
    for (const choice of node.choices) {
      const targets = choice.roll
        ? [choice.roll.success, choice.roll.failure]
        : [choice.goto];
      for (const target of targets) {
        if (!target || DYNAMIC_TARGETS.has(target)) continue;
        push(target);
      }
    }
  }

  for (const id of Object.keys(content.nodes)) {
    if (!seen.has(id)) {
      issues.push({
        severity: 'error',
        node: id,
        message: 'Node is unreachable — nothing links to it',
      });
    }
  }

  return issues;
}

function checkEffect(
  effect: Effect,
  content: StoryContent,
  nodeId: string,
  err: (message: string, node?: string) => void,
): void {
  if ('grantPerk' in effect && !content.perks[effect.grantPerk]) {
    err(`Grants missing perk "${effect.grantPerk}"`, nodeId);
  }
  if ('recruit' in effect && !content.companions[effect.recruit]) {
    err(`Recruits missing companion "${effect.recruit}"`, nodeId);
  }
  if ('loyalty' in effect && !content.companions[effect.loyalty]) {
    err(`Adjusts loyalty of missing companion "${effect.loyalty}"`, nodeId);
  }
  if ('kill' in effect && !content.companions[effect.kill]) {
    err(`Kills missing companion "${effect.kill}"`, nodeId);
  }
  if ('dismiss' in effect && !content.companions[effect.dismiss]) {
    err(`Dismisses missing companion "${effect.dismiss}"`, nodeId);
  }
  if ('travelTo' in effect && !content.locations[effect.travelTo]) {
    err(`Travels to missing location "${effect.travelTo}"`, nodeId);
  }
  if ('stat' in effect && !STAT_IDS.includes(effect.stat)) {
    err(`Unknown stat "${effect.stat}"`, nodeId);
  }
  if ('resource' in effect && !RESOURCE_IDS.includes(effect.resource)) {
    err(`Unknown resource "${effect.resource}"`, nodeId);
  }
  if ('faction' in effect && !FACTION_IDS.includes(effect.faction)) {
    err(`Unknown faction "${effect.faction}"`, nodeId);
  }
}

function checkCondition(
  condition: Condition,
  content: StoryContent,
  nodeId: string,
  err: (message: string, node?: string) => void,
): void {
  if ('all' in condition) {
    condition.all.forEach((c) => checkCondition(c, content, nodeId, err));
    return;
  }
  if ('any' in condition) {
    condition.any.forEach((c) => checkCondition(c, content, nodeId, err));
    return;
  }
  if ('not' in condition) {
    checkCondition(condition.not, content, nodeId, err);
    return;
  }
  if ('hasPerk' in condition && !content.perks[condition.hasPerk]) {
    err(`Condition requires missing perk "${condition.hasPerk}"`, nodeId);
  }
  if ('hasTrait' in condition && !content.traits[condition.hasTrait]) {
    err(`Condition requires missing trait "${condition.hasTrait}"`, nodeId);
  }
  if ('companion' in condition && !content.companions[condition.companion]) {
    err(`Condition requires missing companion "${condition.companion}"`, nodeId);
  }
  if ('loyalty' in condition && !content.companions[condition.loyalty]) {
    err(`Condition references missing companion "${condition.loyalty}"`, nodeId);
  }
  if ('visited' in condition && !content.locations[condition.visited]) {
    err(`Condition references missing location "${condition.visited}"`, nodeId);
  }
}
