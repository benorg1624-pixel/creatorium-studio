// Maps an engine-agnostic Creatorium compilation to the existing Studio MuAPI API.

function referenceUrls(references = []) {
  return references
    .map((ref) => typeof ref === 'string' ? ref : ref?.url || ref?.uri)
    .filter(Boolean);
}

export function toMuapiParams(compiled, route) {
  if (!compiled || !route) throw new Error('toMuapiParams requires compiled context and route');
  if (!route.model) throw new Error('Creatorium route requires a concrete model before execution');

  const refs = referenceUrls(compiled.references);
  const output = compiled.output || {};
  const params = {
    model: route.model,
    prompt: compiled.prompt,
  };

  if (output.aspectRatio) params.aspect_ratio = output.aspectRatio;
  if (output.resolution) params.resolution = output.resolution;
  if (output.duration) params.duration = output.duration;
  if (output.quality) params.quality = output.quality;
  if (refs.length === 1) params.image_url = refs[0];
  if (refs.length > 1) params.images_list = refs;

  return params;
}

export async function executeMuapi({ apiKey, compiled, route, studio }) {
  if (!studio) throw new Error('executeMuapi requires the Studio MuAPI module');
  const params = toMuapiParams(compiled, route);

  switch (route.task) {
    case 't2i': return studio.generateImage(apiKey, params);
    case 'i2i': return studio.generateI2I(apiKey, params);
    case 't2v': return studio.generateVideo(apiKey, params);
    case 'i2v': return studio.generateI2V(apiKey, params);
    default: throw new Error(`Unsupported Creatorium MuAPI task: ${route.task}`);
  }
}
