// Engine-agnostic creative specification.

export const PROMPT_SPEC_VERSION = '0.1';

export function createPromptSpec({
  scene,
  composition = '',
  subject = '',
  action = '',
  environment = '',
  lighting = '',
  camera = '',
  visualLanguage = '',
  continuity = {},
  avoid = [],
  output = {},
}) {
  if (!scene) throw new Error('PromptSpec.scene is required');

  return {
    version: PROMPT_SPEC_VERSION,
    scene,
    composition,
    subject,
    action,
    environment,
    lighting,
    camera,
    visualLanguage,
    continuity,
    avoid: Array.isArray(avoid) ? avoid : [avoid],
    output: {
      modality: output.modality || 'image',
      aspectRatio: output.aspectRatio || '4:5',
      ...output,
    },
  };
}
