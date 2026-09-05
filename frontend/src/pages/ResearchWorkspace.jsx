import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Pipeline from '../components/Pipeline';
import EvidenceExplorer from '../components/EvidenceExplorer';
import KnowledgeGraph from '../components/KnowledgeGraph';
import ReportReader from '../components/ReportReader';
import EvaluationPanel from '../components/EvaluationPanel';
import AgentExecutionTrace from '../components/AgentExecutionTrace';

const sections = [
    ['overview', 'Overview'],
    ['report', 'Report'],
  ['pipeline', 'Pipeline'],
  ['execution', 'Agents'],
  ['evidence', 'Evidence'],
  ['evaluation', 'Evaluation'],
  ['graph', 'Knowledge Graph'],
];

export default function ResearchWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const research = location.state?.research;
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!research) navigate('/', { replace: true });
  }, [navigate, research]);

  const stats = useMemo(() => ({
    topics: research?.topics?.length || 0,
    evidence: research?.evidence?.length || 0,
    agents: research?.traces?.length || 0,
    score: research?.evaluation?.overallScore,
  }), [research]);

  if (!research) return <div className="app-shell grid place-items-center"><p className="text-sm text-slate-400">Loading research workspace...</p></div>;

  const completed = research.summary?.success === true;
  const content = {
    overview: <Overview research={research} stats={stats} onNavigate={setActiveSection} />,
    pipeline: <Pipeline research={research} />,
    execution: <AgentExecutionTrace research={research} />,
    evidence: <EvidenceExplorer evidence={research.evidence} />,
    graph: <KnowledgeGraph research={research} />,
    report: <ReportReader report={research.report} />,
    evaluation: <EvaluationPanel evaluation={research.evaluation} />,
  }[activeSection];

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-6">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-3 text-left text-sm font-semibold text-white"><span className="grid h-8 w-8 place-items-center border border-cyan-300/40 bg-cyan-300/10 font-mono text-xs text-cyan-200">R/</span><span className="hidden sm:inline">Research OS</span></button>
            <div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-300">{research.query}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-600">RUN / {research.runId}</p></div>
            <div className="flex items-center gap-3"><span className={`hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest sm:flex ${completed ? 'text-emerald-300' : 'text-rose-300'}`}><span className={`status-dot ${completed ? '' : 'muted'}`} /> {completed ? 'Completed' : 'Failed'}</span><button type="button" onClick={() => navigate('/')} className="border border-white/15 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-200/50 hover:text-white">New research</button></div>
          </div>
          <nav className="workspace-nav flex gap-1 overflow-x-auto" aria-label="Research navigation">{sections.map(([id, label]) => <button key={id} type="button" aria-current={activeSection === id ? 'page' : undefined} onClick={() => setActiveSection(id)} className={`border-b-2 px-3 py-3 text-xs transition ${activeSection === id ? 'border-cyan-200 text-cyan-100' : 'border-transparent text-slate-500 hover:text-slate-200'}`}>{label}</button>)}</nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end"><div><p className="eyebrow mb-3">Research control room</p><h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-white sm:text-4xl">{research.query}</h1></div><div className="text-left sm:text-right"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Status</p><p className={`mt-2 text-sm font-medium ${completed ? 'text-emerald-300' : 'text-rose-300'}`}>{completed ? 'Completed successfully' : 'Workflow failed'}</p></div></div>
        <div className="workspace-content" key={activeSection}>{content}</div>
      </main>
    </div>
  );
}

function Overview({ research, stats, onNavigate }) {
  const cards = [['Topics', stats.topics, 'Planner output', 'pipeline'], ['Evidence', stats.evidence, 'Collected sources', 'evidence'], ['Agent traces', stats.agents, 'Recorded execution', 'execution'], ['Quality score', stats.score ?? '—', 'Evaluation output', 'evaluation']];
  return <div className="space-y-8"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, hint, target]) => <button type="button" key={label} onClick={() => onNavigate(target)} className="glass-panel p-5 text-left transition hover:border-cyan-200/40"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</p><p className="mt-4 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-xs text-slate-500">{hint} <span className="float-right text-cyan-200">↗</span></p></button>)}</div><div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]"><section className="glass-panel p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><div><p className="eyebrow mb-2">Workflow state</p><h2 className="text-lg font-semibold text-white">Execution pipeline</h2></div><button type="button" onClick={() => onNavigate('pipeline')} className="font-mono text-[10px] uppercase tracking-widest text-cyan-200">Open pipeline →</button></div><Pipeline research={research} compact /></section><section className="glass-panel p-5 sm:p-7"><p className="eyebrow mb-2">Research output</p><h2 className="text-lg font-semibold text-white">A report built from the run</h2><p className="mt-4 line-clamp-5 text-sm leading-7 text-slate-400">{research.report || 'Report output is unavailable for this run.'}</p><button type="button" onClick={() => onNavigate('report')} className="mt-6 border-b border-cyan-200/40 pb-1 text-xs text-cyan-100">Read full report →</button></section></div></div>;
}
