import React, { useMemo, useState } from 'react';
import { compileContext } from './contextCompiler.js';
import { routeModel } from './modelRouter.js';
import { toMuapiParams } from './adapters/muapiAdapter.js';

export function CreatoriumGenerate({ project, world, shot, models = [], onGenerate, generating = false, externalError = '' }) {
  const [model, setModel] = useState(models[0]?.id || '');
  const [localError, setLocalError] = useState('');
  const [status, setStatus] = useState('Ready');
  const compiled = useMemo(() => compileContext({ project, world, shot }), [project, world, shot]);
  const route = useMemo(() => routeModel(compiled, { preferredModel: model || null }), [compiled, model]);
  const refs = compiled.references || [];

  async function generate() {
    if (!model || generating) return;
    setLocalError('');
    setStatus('Starting…');
    try {
      const payload = toMuapiParams(compiled, route);
      const result = await onGenerate?.({ compiled, route, payload });
      setStatus(result ? 'Completed' : 'Ready');
      return result;
    } catch (err) {
      setLocalError(err?.message || 'Generation failed');
      setStatus('Failed');
    }
  }

  const visibleError = localError || externalError;
  const visibleStatus = generating ? 'Generating…' : status;

  return React.createElement('section', { className: 'creatorium-generate' },
    React.createElement('header', null,
      React.createElement('p', { className: 'creatorium-kicker' }, 'CREATORIUM™ STUDIO / GENERATE'),
      React.createElement('h1', null, shot.title),
      React.createElement('p', null, `${project.name} · ${world.name} · Shot ${shot.id}`)
    ),
    React.createElement('div', { className: 'creatorium-grid' },
      React.createElement('div', { className: 'creatorium-panel' },
        React.createElement('label', null, 'Project'), React.createElement('strong', null, project.name),
        React.createElement('label', null, 'World'), React.createElement('strong', null, world.name),
        React.createElement('label', null, 'References'),
        React.createElement('div', { className: 'creatorium-references' }, refs.map((ref, i) =>
          React.createElement('span', { key: ref.id || i }, ref.role || ref.id || `Reference ${i + 1}`)
        )),
        React.createElement('label', { htmlFor: 'creatorium-model' }, 'Model'),
        React.createElement('select', { id: 'creatorium-model', value: model, disabled: generating, onChange: (e) => { setModel(e.target.value); setLocalError(''); setStatus('Ready'); } },
          React.createElement('option', { value: '' }, 'Select model'),
          models.map((item) => React.createElement('option', { key: item.id, value: item.id }, item.name || item.id))
        ),
        React.createElement('p', { className: 'creatorium-route' }, `Route: ${route.engine} / ${route.task}`),
        React.createElement('button', { type: 'button', onClick: generate, disabled: !model || generating }, generating ? 'Generating…' : 'Generate'),
        React.createElement('p', { className: `creatorium-generation-status ${visibleError ? 'is-error' : ''}`, role: visibleError ? 'alert' : 'status' }, visibleError || `Status: ${visibleStatus}`)
      ),
      React.createElement('div', { className: 'creatorium-panel creatorium-context' },
        React.createElement('label', null, 'Compiled context'),
        React.createElement('pre', null, compiled.prompt)
      )
    )
  );
}
