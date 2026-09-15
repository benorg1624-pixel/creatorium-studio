import { createProject, createWorld, createShot } from '../src/domain.js';
import { createPromptSpec } from '../src/promptSpec.js';
import { compileContext } from '../src/contextCompiler.js';

const project = createProject({
  id: 'terra-quieta',
  name: 'Terra Quieta',
  description: 'Private mountain estate creative world.',
});

const world = createWorld({
  id: 'terra-quieta-estate',
  projectId: project.id,
  name: 'Terra Quieta Estate',
  locks: {
    architecture: 'local stone, warm timber, dark steel, large glazing, restrained contemporary design',
    landscape: 'private multi-hectare mountain estate with lake, pine forest and rocky terrain',
  },
  references: [
    { id: 'estate-master', role: 'architecture', uri: null },
    { id: 'landscape-master', role: 'landscape', uri: null },
  ],
});

const promptSpec = createPromptSpec({
  scene: 'Architectural visualization of a productive aquaponic garden integrated near the Creatorium studio.',
  composition: 'Wide three-quarter view showing a greenhouse pavilion, exterior growing beds, water channels and landscaped paths.',
  environment: 'Olive trees, grasses, pine forest and rocky mountain terrain.',
  lighting: 'Soft morning light entering through greenhouse glazing.',
  camera: '28mm architectural photography.',
  visualLanguage: 'cinematic architectural editorial, natural material realism, understated sustainable luxury',
  continuity: {
    greenhouse: 'low-profile dark steel, timber and clear glass structure partially embedded into terrain',
    aquaponics: 'closed-loop fish tanks, mechanical and biological filtration, grow beds, DWC channels and vertical growing towers',
  },
  avoid: ['generic industrial greenhouse', 'glossy CGI', 'fantasy landscape', 'oversized infrastructure'],
  output: { modality: 'image', aspectRatio: '4:5' },
});

const shot = createShot({
  id: '71',
  worldId: world.id,
  title: 'AQUAPONIC CREATOR GARDEN',
  promptSpec,
});

export const terraQuietaShot71 = { project, world, shot };
export const terraQuietaShot71Compiled = compileContext(terraQuietaShot71);
