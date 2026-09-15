'use client';

import { useState } from 'react';
import Workspace from './Workspace.js';
import { terraQuietaShot71 } from '../../packages/creatorium-core/examples/terra-quieta-shot-71.js';
import { t2iModels } from '../../packages/studio/src/models.js';
import * as muapi from '../../packages/studio/src/muapi.js';
import '../../packages/creatorium-core/src/creatorium.css';

export default function CreatoriumPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const models = t2iModels;

  async function handleGenerate({ compiled, route, payload }) {
    setError('');
    setGenerating(true);
    try {
      const apiKey = window.localStorage.getItem('muapi_key') || window.localStorage.getItem('muapi_api_key');
      if (!apiKey) throw new Error('MuAPI key missing. Open Studio once and configure your MuAPI key.');
      const { executeMuapi } = await import('../../packages/creatorium-core/src/adapters/muapiAdapter.js');
      const generation = await executeMuapi({ apiKey, compiled, route, studio: muapi });
      const asset = {
        ...generation,
        creatorium: {
          shotId: terraQuietaShot71.shot.id,
          model: route.model,
          task: route.task,
          engine: route.engine,
          prompt: compiled.prompt,
          params: payload,
          createdAt: new Date().toISOString(),
        },
      };
      setResult(asset);
      return asset;
    } catch (err) {
      setError(err?.message || 'Generation failed');
      throw err;
    } finally {
      setGenerating(false);
    }
  }

  return <main>
    <Workspace {...terraQuietaShot71} models={models} onGenerate={handleGenerate} result={result} error={error} generating={generating} />
  </main>;
}
