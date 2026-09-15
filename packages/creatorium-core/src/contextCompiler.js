// Compiles persistent Creatorium world context into an engine-agnostic production prompt package.

function compact(parts) {
  return parts.filter(Boolean).join('\n\n');
}

function normalizeWorldLocks(locks = {}) {
  if ('hard' in locks || 'soft' in locks) {
    return { hard: locks.hard || {}, soft: locks.soft || {} };
  }
  return { hard: {}, soft: locks };
}

function renderLocks(title, locks) {
  const text = Object.entries(locks)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n');
  return text ? `${title}:\n${text}` : '';
}

function normalizeAvoid(avoid) {
  if (!avoid) return [];
  if (Array.isArray(avoid)) return avoid.map(String).map((item) => item.trim()).filter(Boolean);
  return String(avoid).split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

function inferProductionIntent(spec) {
  const text = [spec.scene, spec.subject, spec.environment, spec.visualLanguage].filter(Boolean).join(' ').toLowerCase();
  const architecture = /architect|garden|estate|villa|building|interior|exterior|landscape|greenhouse|aquaponic/.test(text);
  if (!architecture) return { directive: '', avoid: [] };

  return {
    directive: 'PRODUCTION INTENT: Create an environment/architecture image. The named scene is a place or designed system, not a human character. Prioritize spatial design, functional infrastructure, material realism and environmental context.',
    avoid: ['person as main subject', 'fashion portrait', 'fashion editorial', 'pin-up pose', 'character-focused composition'],
  };
}

export function compileContext({ project, world, shot }) {
  if (!project || !world || !shot) throw new Error('compileContext requires project, world and shot');
  if (!shot.promptSpec) throw new Error('compileContext requires shot.promptSpec');

  const spec = shot.promptSpec;
  const { hard, soft } = normalizeWorldLocks(world.locks);
  const shotContinuity = spec.continuity || {};

  for (const key of Object.keys(shotContinuity)) {
    if (Object.prototype.hasOwnProperty.call(hard, key)) {
      throw new Error(`Shot continuity cannot override hard world lock: ${key}`);
    }
  }

  const mergedSoft = { ...soft, ...shotContinuity };
  const intent = inferProductionIntent(spec);
  const avoid = [...new Set([...normalizeAvoid(spec.avoid), ...intent.avoid])];

  const prompt = compact([
    'CREATORIUM PRODUCTION BRIEF',
    `PROJECT: ${project.name}`,
    `WORLD: ${world.name}`,
    renderLocks('HARD CONTINUITY LOCKS — MUST PRESERVE', hard),
    renderLocks('SOFT CONTINUITY LOCKS — PRESERVE WHEN POSSIBLE', mergedSoft),
    intent.directive,
    `SCENE: ${spec.scene}`,
    spec.subject && `SUBJECT: ${spec.subject}`,
    spec.action && `ACTION: ${spec.action}`,
    spec.composition && `COMPOSITION: ${spec.composition}`,
    spec.environment && `ENVIRONMENT / FUNCTION: ${spec.environment}`,
    spec.lighting && `LIGHTING: ${spec.lighting}`,
    spec.camera && `CAMERA: ${spec.camera}`,
    spec.visualLanguage && `VISUAL LANGUAGE: ${spec.visualLanguage}`,
    avoid.length && `NEGATIVE CONSTRAINTS: ${avoid.join(', ')}`,
    'OUTPUT REQUIREMENT: Produce one coherent image that follows the scene, functional/environmental description and continuity constraints. Do not invent a human protagonist unless the SUBJECT explicitly requests one.',
  ]);

  return {
    prompt,
    references: [...(world.references || []), ...(shot.references || [])],
    output: spec.output,
    locks: { hard, soft: mergedSoft },
    constraints: { avoid, productionIntent: intent.directive },
    metadata: {
      projectId: project.id,
      worldId: world.id,
      shotId: shot.id,
      promptSpecVersion: spec.version,
      compilerVersion: '0.2',
    },
  };
}
