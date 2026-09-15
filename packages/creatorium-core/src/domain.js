// CREATORIUM Studio core domain model — v0.1

export const ENTITY_TYPES = Object.freeze({
  PROJECT: 'project',
  WORLD: 'world',
  SHOT: 'shot',
  GENERATION: 'generation',
  ASSET: 'asset',
});

export function createProject({ id, name, description = '', worlds = [] }) {
  return { id, type: ENTITY_TYPES.PROJECT, name, description, worlds };
}

export function createWorld({ id, projectId, name, bible = {}, locks = {}, references = [] }) {
  return { id, type: ENTITY_TYPES.WORLD, projectId, name, bible, locks, references };
}

export function createShot({ id, worldId, title, promptSpec, references = [], previousShotId = null }) {
  return { id, type: ENTITY_TYPES.SHOT, worldId, title, promptSpec, references, previousShotId };
}

export function createGeneration({ id, shotId, engine, model, status = 'queued', request = {}, result = null }) {
  return { id, type: ENTITY_TYPES.GENERATION, shotId, engine, model, status, request, result };
}

export function createAsset({ id, generationId, kind, uri, metadata = {}, score = null }) {
  return { id, type: ENTITY_TYPES.ASSET, generationId, kind, uri, metadata, score };
}
