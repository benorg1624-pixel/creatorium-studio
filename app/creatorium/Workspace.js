'use client';

import { useMemo, useState } from 'react';
import { CreatoriumGenerate } from '../../packages/creatorium-core/src/CreatoriumGenerate.js';

export default function Workspace({ project, world, shot, models, onGenerate, result, error, generating }) {
  const [activeView, setActiveView] = useState('shot');
  const [draftShot, setDraftShot] = useState(shot);
  const hardLocks = useMemo(() => Object.entries(world.locks?.hard || {}), [world]);
  const softLocks = useMemo(() => Object.entries(world.locks?.soft || {}), [world]);
  const references = [...(world.references || []), ...(draftShot.references || [])];
  const spec = draftShot.promptSpec || {};

  function updateSpec(field, value) {
    setDraftShot((current) => ({ ...current, promptSpec: { ...current.promptSpec, [field]: value } }));
  }

  async function generate(args) {
    const generated = await onGenerate?.(args);
    if (generated) setActiveView('assets');
    return generated;
  }

  return <div className="creatorium-workspace">
    <aside className="creatorium-sidebar">
      <p className="creatorium-kicker">CREATORIUM™ STUDIO</p>
      <p className="creatorium-sidebar-label">WORKSPACE</p>
      <nav aria-label="Creatorium workspace">
        <button className={activeView === 'project' ? 'active' : ''} onClick={() => setActiveView('project')}>Project · {project.name}</button>
        <button className={activeView === 'world' ? 'active' : ''} onClick={() => setActiveView('world')}>World · {world.name}</button>
        <button className={activeView === 'shot' ? 'active' : ''} onClick={() => setActiveView('shot')}>Shot {draftShot.id} · {draftShot.title}</button>
        <button className={activeView === 'assets' ? 'active' : ''} onClick={() => setActiveView('assets')}>Assets{generating ? ' · Generating…' : result ? ' · 1' : ''}</button>
      </nav>
    </aside>

    <section className="creatorium-workspace-main">
      {activeView === 'project' && <article className="creatorium-inspector"><p className="creatorium-kicker">PROJECT</p><h1>{project.name}</h1><p>{project.description || 'No project description yet.'}</p></article>}

      {activeView === 'world' && <article className="creatorium-inspector">
        <p className="creatorium-kicker">WORLD BIBLE</p><h1>{world.name}</h1>
        <h2>Hard locks</h2>{hardLocks.length ? hardLocks.map(([key, value]) => <p key={key}><strong>{key}</strong> · {String(value)}</p>) : <p>No hard locks yet.</p>}
        <h2>Soft locks</h2>{softLocks.length ? softLocks.map(([key, value]) => <p key={key}><strong>{key}</strong> · {String(value)}</p>) : <p>No soft locks yet.</p>}
        <h2>References</h2><p>{references.length} reference{references.length === 1 ? '' : 's'}</p>
      </article>}

      {activeView === 'shot' && <div className="creatorium-shot-layout">
        <section className="creatorium-shot-editor">
          <p className="creatorium-kicker">SHOT {draftShot.id} / EDITOR</p>
          <input className="creatorium-title-input" value={draftShot.title} onChange={(e) => setDraftShot({ ...draftShot, title: e.target.value })} aria-label="Shot title" />
          <div className="creatorium-fields">
            {['scene','subject','action','composition','environment','lighting','camera','visualLanguage','avoid'].map((field) => <label key={field}>{field.replace(/([A-Z])/g, ' $1')}<textarea rows={field === 'scene' ? 3 : 2} value={spec[field] || ''} onChange={(e) => updateSpec(field, e.target.value)} placeholder={`Define ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}…`} /></label>)}
          </div>
          {error && <p className="creatorium-error" role="alert">{error}</p>}
          <CreatoriumGenerate project={project} world={world} shot={draftShot} models={models} onGenerate={generate} generating={generating} />
        </section>
        <aside className="creatorium-right-inspector">
          <p className="creatorium-kicker">WORLD CONTEXT</p>
          <h3>Hard locks <span>{hardLocks.length}</span></h3>
          {hardLocks.length ? hardLocks.map(([key,value]) => <div className="creatorium-lock" key={key}><strong>{key}</strong><small>{String(value)}</small></div>) : <p className="creatorium-muted">No hard locks defined.</p>}
          <h3>Soft locks <span>{softLocks.length}</span></h3>
          {softLocks.length ? softLocks.map(([key,value]) => <div className="creatorium-lock" key={key}><strong>{key}</strong><small>{String(value)}</small></div>) : <p className="creatorium-muted">No soft locks defined.</p>}
          <h3>References <span>{references.length}</span></h3>
          <p className="creatorium-muted">{references.length ? 'References attached to this context.' : 'No references attached yet.'}</p>
        </aside>
      </div>}

      {activeView === 'assets' && <article className="creatorium-inspector creatorium-assets">
        <p className="creatorium-kicker">ASSETS / SHOT {draftShot.id}</p><h1>Generation output</h1>
        {generating && <div className="creatorium-generating">Generating asset…</div>}
        {error && <p className="creatorium-error" role="alert">{error}</p>}
        {result?.url ? <div className="creatorium-asset-card">
          <img src={result.url} alt={`Generated asset for ${draftShot.title}`} />
          <div><strong>{draftShot.title}</strong><p>{result.creatorium?.model}</p><p>{result.creatorium?.task} · {result.creatorium?.engine}</p><small>{result.creatorium?.createdAt}</small></div>
        </div> : !generating && !result && <p>No generated asset yet.</p>}
        {result && !result.url && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </article>}
    </section>
  </div>;
}
