// CREATORIUM capability-based model router — v0.1

const DEFAULT_POLICIES = Object.freeze({
  image: ['i2i', 't2i'],
  video: ['i2v', 't2v'],
});

export function inferTask(compiled) {
  const media = compiled?.output?.media || 'image';
  const hasReferences = (compiled?.references || []).length > 0;
  if (media === 'video') return hasReferences ? 'i2v' : 't2v';
  return hasReferences ? 'i2i' : 't2i';
}

export function routeModel(compiled, { preferredModel = null, preferredEngine = 'muapi' } = {}) {
  const task = inferTask(compiled);
  return {
    engine: preferredEngine,
    task,
    model: preferredModel,
    policy: DEFAULT_POLICIES[compiled?.output?.media || 'image'],
    reason: preferredModel ? 'explicit-model' : 'capability-auto-route',
  };
}
