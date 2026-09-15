'use client';

import { useState } from 'react';
import { CreatoriumGenerate } from '../../packages/creatorium-core/src/CreatoriumGenerate.js';
import { terraQuietaShot71 } from '../../packages/creatorium-core/examples/terra-quieta-shot-71.js';
import { t2iModels, i2iModels } from '../../packages/studio/src/models.js';
import * as muapi from '../../packages/studio/src/muapi.js';
import '../../packages/creatorium-core/src/creatorium.css';

export default function CreatoriumPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const models = [...i2iModels, ...t2iModels];

  async function handleGenerate({ compiled, route }) {
    setError('');
    setResult(null);
    try {
      const apiKey = window.localStorage.getItem('muapi_key') || window.localStorage.getItem('muapi_api_key');
      if (!apiKey) throw new Error('MuAPI key missing. Configure it in Studio first.');
      const { executeMuapi } = await import('../../packages/creatorium-core/src/adapters/muapiAdapter.js');
      const generation = await executeMuapi({ apiKey, compiled, route, studio: muapi });
      setResult(generation);
      return generation;
    } catch (err) {
      setError(err?.message || 'Generation failed');
      throw err;
    }
  }

  return <main>
    <CreatoriumGenerate {...terraQuietaShot71} models={models} onGenerate={handleGenerate} />
    {(error || result) && <section className="creatorium-runtime">
      {error && <p role="alert">{error}</p>}
      {result?.url && <img src={result.url} alt="Creatorium generation result" />}
      {result && !result.url && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </section>}
  </main>;
}
