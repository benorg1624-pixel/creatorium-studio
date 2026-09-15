// Compiles persistent Creatorium world context into an engine-agnostic prompt package.

function compact(parts) {
  return parts.filter(Boolean).join('\n\n');
}

function normalizeWorldLocks(locks = {}) {
  if ('hard' in locks || 'soft' in locks) {
    return { hard: locks.hard || {}, soft: locks.soft || {} };
  }
  // Legacy flat world locks remain supported as soft locks.
  return { hard: {}, soft: locks };
}

function renderLocks(title, locks) {
  const text = Object.entries(locks)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n');
  return text ? `${title}:\n${text}` : '';
}

export function compileContext({ project, world, shot }) {
  if (!project || !world || !shot) {
    throw new Error('compileContext requires project, world and shot');
  }
  if (!shot.promptSpec) {
    throw new Error('compileContext requires shot.promptSpec');
  }

  const spec = shot.promptSpec;
  const { hard, soft } = normalizeWorldLocks(world.locks);
  const shotContinuity = spec.continuity || {};

  for (const key of Object.keys(shotContinuity)) {
    if (Object.prototype.hasOwnProperty.call(hard, key)) {
      throw new Error(`Shot continuity cannot override hard world lock: ${key}`);
    }
  }

  const mergedSoft = { ...soft, ...shotContinuity };

  const prompt = compact([
    `PROJECT: ${project.name}`,
    `WORLD: ${world.name}`,
    renderLocks('HARD CONTINUITY LOCKS', hard),
    renderLocks('SOFT CONTINUITY LOCKS', mergedSoft),
    `SCENE: ${spec.scene}`,
    spec.subject && `SUBJECT: ${spec.subject}`,
    spec.action && `ACTION: ${spec.action}`,
    spec.composition && `COMPOSITION: ${spec.composition}`,
    spec.environment && `ENVIRONMENT: ${spec.environment}`,
    spec.lighting && `LIGHTING: ${spec.lighting}`,
    spec.camera && `CAMERA: ${spec.camera}`,
    spec.visualLanguage && `VISUAL LANGUAGE: ${spec.visualLanguage}`,
    spec.avoid?.length && `AVOID: ${spec.avoid.join(', ')}`,
  ]);

  return {
    prompt,
    references: [...(world.references || []), ...(shot.references || [])],
    output: spec.output,
    locks: { hard, soft: mergedSoft },
    metadata: {
      projectId: project.id,
      worldId: world.id,
      shotId: shot.id,
      promptSpecVersion: spec.version,
    },
  };
}
