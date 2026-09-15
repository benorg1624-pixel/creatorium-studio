'use client';

import { useMemo, useState } from 'react';
import { CreatoriumGenerate } from '../../packages/creatorium-core/src/CreatoriumGenerate.js';

export default function Workspace({ project, world, shot, models, onGenerate, result, error }) {
  const [activeView, setActiveView] = useState('shot');
  const hardLocks = useMemo(() => Object.entries(world.locks?.hard || {}), [world]);
  const softLocks = useMemo(() => Object.entries(world.locks?.soft || {}), [world]);
  const references = [...(world.references || []), ...(shot.references || [])];

  return <div className="creatorium-workspace">
    <aside className="creatorium-sidebar">
      <p className="creatorium-kicker">CREATORIUM™ STUDIO</p>
      <nav aria-label="Creatorium workspace">
        <button className={activeView === 'project' ? 'active' : ''} onClick={() => setActiveView('project')}>Project · {project.name}</button>
        <button className={activeView === 'world' ? 'active' : ''} onClick={() => setActiveView('world')}>World · {world.name}</button>
        <button className={activeView === 'shot' ? 'active' : ''} onClick={() => setActiveView('shot')}>Shot {shot.id} · {shot.title}</button>
        <button className={activeView === 'assets' ? 'active' : ''} onClick={() => setActiveView('assets')}>Assets</button>
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

      {activeView === 'shot' && <CreatoriumGenerate project={project} world={world} shot={shot} models={models} onGenerate={onGenerate} />}

      {activeView === 'assets' && <article className="creatorium-inspector"><p className="creatorium-kicker">ASSETS</p><h1>Generation output</h1>{error && <p role="alert">{error}</p>}{result ? <pre>{JSON.stringify(result, null, 2)}</pre> : <p>No generated asset yet.</p>}</article>}
    </section>
  </div>;
}
