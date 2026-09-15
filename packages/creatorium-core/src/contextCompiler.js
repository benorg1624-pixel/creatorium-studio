// Compiles persistent Creatorium world context into a model-ready production prompt.

function normalizeWorldLocks(locks = {}) {
  if ('hard' in locks || 'soft' in locks) return { hard: locks.hard || {}, soft: locks.soft || {} };
  return { hard: {}, soft: locks };
}

function normalizeAvoid(avoid) {
  if (!avoid) return [];
  if (Array.isArray(avoid)) return avoid.map(String).map((x) => x.trim()).filter(Boolean);
  return String(avoid).split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

function sentence(value) {
  if (!value) return '';
  const text = String(value).trim().replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function lockValues(locks) {
  return Object.entries(locks).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
}

function inferIntent(spec) {
  const text = [spec.scene, spec.subject, spec.environment, spec.visualLanguage].filter(Boolean).join(' ').toLowerCase();
  if (/aquaponic|greenhouse|garden|architect|estate|villa|building|interior|exterior|landscape/.test(text)) {
    return {
      opening: 'Photorealistic architectural and landscape photograph of a designed environment, with no human subject.',
      priorities: 'Show the spatial design and functional infrastructure clearly; the place itself is the subject.',
      avoid: ['people', 'human figure', 'woman', 'man', 'fashion', 'portrait', 'fashion editorial', 'character pose'],
    };
  }
  return { opening: 'Create a coherent photorealistic image.', priorities: '', avoid: [] };
}

export function compileContext({ project, world, shot }) {
  if (!project || !world || !shot) throw new Error('compileContext requires project, world and shot');
  if (!shot.promptSpec) throw new Error('compileContext requires shot.promptSpec');

  const spec = shot.promptSpec;
  const { hard, soft } = normalizeWorldLocks(world.locks);
  const shotContinuity = spec.continuity || {};
  for (const key of Object.keys(shotContinuity)) {
    if (Object.prototype.hasOwnProperty.call(hard, key)) throw new Error(`Shot continuity cannot override hard world lock: ${key}`);
  }

  const mergedSoft = { ...soft, ...shotContinuity };
  const intent = inferIntent(spec);
  const avoid = [...new Set([...normalizeAvoid(spec.avoid), ...intent.avoid])];
  const continuity = [...lockValues(hard), ...lockValues(mergedSoft)];

  const positive = [
    intent.opening,
    sentence(spec.scene) && `Scene: ${sentence(spec.scene)}.`,
    sentence(spec.environment) && `Environment and function: ${sentence(spec.environment)}.`,
    sentence(spec.subject) && `Primary subject: ${sentence(spec.subject)}.`,
    sentence(spec.action) && `Action: ${sentence(spec.action)}.`,
    sentence(spec.composition) && `Composition: ${sentence(spec.composition)}.`,
    sentence(spec.lighting) && `Lighting: ${sentence(spec.lighting)}.`,
    sentence(spec.camera) && `Camera: ${sentence(spec.camera)}.`,
    sentence(spec.visualLanguage) && `Visual direction: ${sentence(spec.visualLanguage)}.`,
    intent.priorities,
    continuity.length ? `Continuity requirements: ${continuity.join('; ')}.` : '',
  ].filter(Boolean).join(' ');

  const prompt = `${positive}${avoid.length ? ` Exclude: ${avoid.join(', ')}.` : ''}`;

  return {
    prompt,
    references: [...(world.references || []), ...(shot.references || [])],
    output: spec.output,
    locks: { hard, soft: mergedSoft },
    constraints: { avoid, productionIntent: intent.opening },
    metadata: {
      projectId: project.id,
      worldId: world.id,
      shotId: shot.id,
      promptSpecVersion: spec.version,
      compilerVersion: '0.3',
    },
  };
}
