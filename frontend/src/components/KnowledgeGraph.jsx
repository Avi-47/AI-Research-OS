import { useMemo, useState } from 'react';
import { fetchGraphNeighbors } from '../services/researchService';

export default function KnowledgeGraph({ research }) {
  const graph = research.workflowGraph;
  const [selected, setSelected] = useState(null);
  const [neighborData, setNeighborData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const layout = useMemo(() => {
    const entities = graph?.entities || [];
    const radius = Math.min(180, 90 + entities.length * 8);
    const center = { x: 360, y: 210 };
    const positions = new Map(entities.map((entity, index) => { const angle = (Math.PI * 2 * index) / Math.max(entities.length, 1) - Math.PI / 2; return [entity.id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }]; }));
    return { positions, center };
  }, [graph]);

  if (!graph) return <div className="grid min-h-72 place-items-center border border-dashed border-white/10 p-8 text-center"><div><p className="text-sm text-slate-300">Knowledge graph data is unavailable for this research run.</p><p className="mt-2 max-w-md text-xs leading-6 text-slate-600">Graph extraction did not return entities and relationships. No placeholder nodes are shown.</p></div></div>;

  const selectEntity = async (entity) => {
    setSelected(entity);
    setNeighborData(null);
    setError(null);
    setLoading(true);
    const result = await fetchGraphNeighbors(entity.id);
    setLoading(false);
    if (result.success) setNeighborData(result.data);
    else setError(result.error);
  };

  const selectedIds = selected ? new Set([selected.id, ...(neighborData?.neighbors || []).map((item) => item.target?.id).filter(Boolean)]) : null;
  const isRelated = (relationship) => !selectedIds || selectedIds.has(relationship.source) || selectedIds.has(relationship.target);

  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="eyebrow mb-2">GraphRAG / entity map</p><h2 className="text-lg font-semibold text-white">Research knowledge graph</h2></div><div className="flex items-center gap-2"><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))} className="border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">−</button><span className="w-12 text-center font-mono text-[10px] text-slate-500">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))} className="border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">+</button><button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setSelected(null); }} className="border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">Reset</button></div></div><div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]"><div className="graph-canvas relative min-h-[430px] overflow-hidden"><svg viewBox="0 0 720 420" role="img" aria-label="Interactive research knowledge graph" className="h-full min-h-[430px] w-full" onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(0.7, Math.min(1.6, value + (event.deltaY < 0 ? 0.05 : -0.05)))); }}><g transform={`translate(${offset.x} ${offset.y}) translate(360 210) scale(${zoom}) translate(-360 -210)`}>{(graph.relationships || []).map((relationship, index) => { const source = layout.positions.get(relationship.source); const target = layout.positions.get(relationship.target); if (!source || !target) return null; return <g key={`${relationship.source}-${relationship.target}-${index}`} opacity={isRelated(relationship) ? 1 : 0.22}><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#64748b" strokeWidth="1" strokeDasharray="3 4" /><text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 5} fill="#64748b" fontSize="8" textAnchor="middle">{relationship.type}</text></g>; })}{(graph.entities || []).map((entity) => { const point = layout.positions.get(entity.id); const active = selected?.id === entity.id; return <g key={entity.id} className="graph-node" role="button" tabIndex="0" onClick={() => selectEntity(entity)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectEntity(entity); }} opacity={selectedIds && !selectedIds.has(entity.id) ? 0.35 : 1}><circle cx={point.x} cy={point.y} r={active ? 23 : 19} fill={active ? '#67e8f9' : '#151d2b'} stroke={active ? '#cffafe' : '#818cf8'} strokeWidth={active ? 2 : 1.5} /><text x={point.x} y={point.y + 3} fill={active ? '#071017' : '#e2e8f0'} fontSize="8" textAnchor="middle">{entity.type}</text><text x={point.x} y={point.y + 34} fill="#cbd5e1" fontSize="10" textAnchor="middle">{entity.name.length > 25 ? `${entity.name.slice(0, 23)}…` : entity.name}</text></g>; })}</g></svg><span className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">Scroll to zoom · select an entity to inspect</span></div><aside className="border border-white/10 bg-[#0b111b] p-5">{selected ? <><p className="eyebrow mb-3">Selected entity</p><h3 className="text-lg font-semibold text-white">{selected.name}</h3><p className="mt-1 font-mono text-xs text-cyan-200">{selected.type}</p>{loading && <p className="mt-6 text-xs text-slate-500">Loading connections...</p>}{error && <p className="mt-6 text-xs text-rose-300">{error}</p>}{neighborData && <div className="mt-6 border-t border-white/10 pt-4"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Connections</p><div className="mt-3 space-y-3">{neighborData.neighbors?.length ? neighborData.neighbors.map((item) => <div key={`${item.target?.id}-${item.relationship?.type}`}><p className="text-xs text-slate-300">{item.target?.name}</p><p className="font-mono text-[10px] text-cyan-200">{item.relationship?.type}</p></div>) : <p className="text-xs text-slate-600">No outgoing connections returned.</p>}</div></div>}</> : <div><p className="eyebrow mb-3">Entity inspector</p><p className="text-sm leading-6 text-slate-500">Select a node to inspect its type and query its real Neo4j neighbors.</p><p className="mt-8 font-mono text-xs text-slate-600">{graph.entities?.length || 0} entities<br />{graph.relationships?.length || 0} relationships</p></div>}</aside></div></div>;
}
