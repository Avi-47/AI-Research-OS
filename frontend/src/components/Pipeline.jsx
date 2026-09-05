const stageDefinitions = [
  ['planner-agent', 'Plan', 'Decompose the question', '01'],
  ['research-agent', 'Research', 'Collect evidence', '02'],
  ['graph-builder-agent', 'Knowledge graph', 'Connect entities', '03'],
  ['writer-agent', 'Synthesis', 'Generate the report', '04'],
  ['evaluation-agent', 'Evaluation', 'Assess quality', '05'],
];

function formatDuration(duration) {
  if (!duration) return null;
  return duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${Math.round(duration)}ms`;
}

export default function Pipeline({ research, compact = false }) {
  const traces = Array.isArray(research.traces) ? research.traces : [];
  const traceFor = (agentId) => traces.find((trace) => trace.agentId === agentId);
  const statusFor = (agentId) => {
    if (agentId === 'graph-builder-agent') return research.workflowGraph ? 'COMPLETED' : 'UNAVAILABLE';
    if (agentId === 'evaluation-agent') return research.evaluation ? 'COMPLETED' : 'UNAVAILABLE';
    return traceFor(agentId)?.status || 'UNAVAILABLE';
  };
  const tone = (status) => ({ COMPLETED: 'text-emerald-300', RUNNING: 'text-cyan-200', FAILED: 'text-rose-300', FALLBACK: 'text-amber-300', UNAVAILABLE: 'text-slate-600' }[status] || 'text-slate-500');

  return <div className={compact ? 'space-y-4' : 'space-y-8'}><div className={compact ? 'space-y-3' : 'grid gap-3 md:grid-cols-5'}>{stageDefinitions.map(([agentId, label, description, number], index) => { const trace = traceFor(agentId); const status = statusFor(agentId); return <div key={agentId} className={`relative ${compact ? 'flex items-center gap-4 border-b border-white/10 pb-3 last:border-0' : 'glass-panel p-4'}`}><div className={`grid h-9 w-9 shrink-0 place-items-center border border-white/10 bg-white/[0.03] font-mono text-xs ${tone(status)}`}>{number}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium text-white">{label}</h3><span className={`font-mono text-[10px] uppercase ${tone(status)}`}>{status}</span></div><p className="mt-1 text-xs text-slate-500">{description}</p>{trace?.durationMs && <p className="mt-2 font-mono text-[10px] text-slate-600">{formatDuration(trace.durationMs)}</p>}</div>{!compact && index < stageDefinitions.length - 1 && <span className="absolute -right-3 top-1/2 hidden text-cyan-200/50 md:block">→</span>}</div>; })}</div>{!compact && <div className="glass-panel p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow mb-2">Planner output</p><h2 className="text-lg font-semibold text-white">Research topics</h2></div><span className="font-mono text-xs text-slate-500">{research.topics?.length || 0} topics</span></div><div className="flex flex-wrap gap-2">{research.topics?.length ? research.topics.map((topic) => <span key={topic} className="border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-300">{topic}</span>) : <p className="text-sm text-slate-500">No topics were returned.</p>}</div></div>}</div>;
}
