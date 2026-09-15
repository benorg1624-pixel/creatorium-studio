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
  const [debug, setDebug] = useState(null);
  const models = t2iModels;

  async function handleGenerate({ compiled, route, payload }) {
    setError('');
    setGenerating(true);
    const startedAt = new Date().toISOString();
    setDebug({
      status: 'submitting',
      startedAt,
      model: route.model,
      task: route.task,
      engine: route.engine,
      prompt: compiled.prompt,
      payload: { ...payload },
      requestId: null,
      resultUrl: null,
    });
    try {
      const apiKey = window.localStorage.getItem('muapi_key') || window.localStorage.getItem('muapi_api_key');
      if (!apiKey) throw new Error('MuAPI key missing. Open Studio once and configure your MuAPI key.');
      const { executeMuapi } = await import('../../packages/creatorium-core/src/adapters/muapiAdapter.js');
      const generation = await executeMuapi({
        apiKey,
        compiled,
        route,
        studio: muapi,
        onRequestId: (requestId) => setDebug((current) => ({ ...current, requestId, status: 'polling' })),
      });
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
      setDebug((current) => ({
        ...current,
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultUrl: generation?.url || null,
      }));
      setResult(asset);
      return asset;
    } catch (err) {
      setDebug((current) => ({ ...current, status: 'failed', error: err?.message || 'Generation failed' }));
      setError(err?.message || 'Generation failed');
      throw err;
    } finally {
      setGenerating(false);
    }
  }

  return <main>
    <Workspace {...terraQuietaShot71} models={models} onGenerate={handleGenerate} result={result} error={error} generating={generating} debug={debug} />
  </main>;
}
