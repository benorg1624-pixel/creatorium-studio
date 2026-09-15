// CREATORIUM capability-based model router — v0.1

const DEFAULT_POLICIES = Object.freeze({
  image: ['i2i', 't2i'],
  video: ['i2v', 't2v'],
});

export function hasUsableReference(references = []) {
  return references.some((ref) => {
    if (typeof ref === 'string') return Boolean(ref.trim());
    return Boolean(ref?.url || ref?.uri);
  });
}

export function inferTask(compiled) {
  const modality = compiled?.output?.modality || 'image';
  const hasReferences = hasUsableReference(compiled?.references || []);

  if (modality === 'video') return hasReferences ? 'i2v' : 't2v';
  if (modality === 'image') return hasReferences ? 'i2i' : 't2i';

  throw new Error(`Unsupported Creatorium modality: ${modality}`);
}

export function routeModel(compiled, { preferredModel = null, preferredEngine = 'muapi' } = {}) {
  const modality = compiled?.output?.modality || 'image';
  const task = inferTask(compiled);

  return {
    engine: preferredEngine,
    task,
    model: preferredModel,
    policy: DEFAULT_POLICIES[modality],
    reason: preferredModel ? 'explicit-model' : 'capability-auto-route',
  };
}
