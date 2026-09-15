import { createProject, createWorld, createShot } from '../src/domain.js';
import { createPromptSpec } from '../src/promptSpec.js';
import { compileContext } from '../src/contextCompiler.js';

// Only confirmed canonical fields are populated here.
// Production locks, references and shot details must come from Creatorium data,
// never from fixture assumptions.
const project = createProject({
  id: 'terra-quieta',
  name: 'Terra Quieta',
});

const world = createWorld({
  id: 'terra-quieta-world',
  projectId: project.id,
  name: 'Terra Quieta',
  locks: { hard: {}, soft: {} },
  references: [],
});

const promptSpec = createPromptSpec({
  scene: 'Aquaponic Creator Garden',
  output: { modality: 'image' },
});

const shot = createShot({
  id: '71',
  worldId: world.id,
  title: 'Aquaponic Creator Garden',
  promptSpec,
});

export const terraQuietaShot71 = { project, world, shot };
export const terraQuietaShot71Compiled = compileContext(terraQuietaShot71);
