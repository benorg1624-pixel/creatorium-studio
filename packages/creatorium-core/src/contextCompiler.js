// Compiles persistent Creatorium world context into an engine-agnostic prompt package.

function compact(parts) {
  return parts.filter(Boolean).join('\n\n');
}

export function compileContext({ project, world, shot }) {
  if (!project || !world || !shot) {
    throw new Error('compileContext requires project, world and shot');
  }

  const spec = shot.promptSpec;
  const locks = {
    ...(world.locks || {}),
    ...(spec.continuity || {}),
  };

  const lockText = Object.entries(locks)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n');

  const prompt = compact([
    `PROJECT: ${project.name}`,
    `WORLD: ${world.name}`,
    lockText && `CONTINUITY LOCKS:\n${lockText}`,
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
    metadata: {
      projectId: project.id,
      worldId: world.id,
      shotId: shot.id,
      promptSpecVersion: spec.version,
    },
  };
}
