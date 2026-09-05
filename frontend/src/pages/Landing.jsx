import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startResearch } from '../services/researchService';

const examples = [
  'Modern neural network pruning methods',
  'Latest approaches to RAG evaluation',
  'Transformer efficiency techniques',
];

const stages = [
  ['01', 'PLAN', 'Planner Agent decomposes a complex question into focused research topics.'],
  ['02', 'RESEARCH', 'Research agents collect evidence and semantic context for each topic.'],
  ['03', 'CONNECT', 'Retrieval and the knowledge graph connect the useful parts of the evidence.'],
  ['04', 'SYNTHESIZE', 'Writer Agent turns the collected context into a structured report.'],
  ['05', 'EVALUATE', 'Evaluation Agent assesses grounding, structure, and overall quality.'],
];

const technologies = [
  ['React', 'The interactive research workspace and report reader.'],
  ['Node.js', 'The API and runtime boundary for the multi-agent workflow.'],
  ['PostgreSQL', 'Persistent workflow, agent, evidence, and evaluation records.'],
  ['Qdrant', 'Semantic vector retrieval for relevant research memory.'],
  ['Neo4j', 'Graph storage for entities and relationships discovered in evidence.'],
  ['AI Gateway', 'Provider-independent model selection, fallback, and normalization.'],
];

export default function Landing() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('#research-query')?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleSearch = async (searchQuery = query) => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setError('Enter a research question to begin.');
      document.querySelector('#research-query')?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    const result = await startResearch(normalizedQuery);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Research could not be started. Try again.');
      return;
    }
    navigate(`/research/${result.data.runId}`, { state: { research: result.data } });
  };

  return (
    <div className="app-shell site-grid">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white">
            <span className="grid h-8 w-8 place-items-center border border-cyan-300/40 bg-cyan-300/10 font-mono text-xs text-cyan-200">R/</span>
            Research OS
          </a>
          <nav className="hidden items-center gap-7 text-xs text-slate-400 md:flex" aria-label="Primary navigation">
            <a className="transition hover:text-white" href="#research">Research</a>
            <a className="transition hover:text-white" href="#how-it-works">How It Works</a>
            <a className="transition hover:text-white" href="#technology">Technology</a>
            <a className="transition hover:text-white" href="#about">About</a>
          </nav>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500"><span className="status-dot" /> Workspace ready</span>
        </div>
      </header>

      <main id="top">
        <section id="research" className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-32 lg:pt-28">
          <div className="reveal self-center">
            <p className="eyebrow mb-6">AI-powered research workspace</p>
            <h1 className="display max-w-3xl text-5xl leading-[0.98] text-white sm:text-7xl">Turn questions into <span className="text-cyan-200">structured intelligence.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">Research OS decomposes complex questions, gathers evidence, connects knowledge, generates reports, and evaluates the result.</p>
            <div className="mt-9 flex flex-wrap gap-3 text-xs text-slate-500"><span className="border border-white/10 px-3 py-2">Multi-agent orchestration</span><span className="border border-white/10 px-3 py-2">Hybrid GraphRAG</span><span className="border border-white/10 px-3 py-2">Evidence-backed reports</span></div>
          </div>

          <div className="reveal glass-panel relative p-1" style={{ animationDelay: '120ms' }}>
            <div className="absolute -top-3 left-6 bg-[#080b12] px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200">Start a research run</div>
            <div className="bg-[#0b111b] p-6 sm:p-8">
              <div className="mb-8 flex items-start justify-between"><div><p className="font-mono text-xs text-slate-500">QUERY CONSOLE / 001</p><h2 className="mt-2 text-xl font-semibold text-white">What should we investigate?</h2></div><span className="font-mono text-[10px] text-slate-600">SYNC WORKFLOW</span></div>
              <label className="sr-only" htmlFor="research-query">Research question</label>
              <textarea id="research-query" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleSearch(); }} placeholder="Compare recent approaches to..." rows={4} className="w-full resize-none border border-white/10 bg-[#080b12] p-4 text-base leading-7 text-white placeholder:text-slate-600 focus:border-cyan-300/60 focus:outline-none" />
              <div className="mt-4 flex items-center justify-between gap-4"><span className="font-mono text-[10px] text-slate-600">CTRL / CMD + ENTER TO RUN</span><button type="button" onClick={() => handleSearch()} disabled={loading} className="bg-cyan-200 px-5 py-3 text-sm font-semibold text-[#071017] transition hover:bg-white disabled:cursor-wait disabled:opacity-50">{loading ? 'Processing...' : 'Start research  →'}</button></div>
              {loading && <div className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center gap-3 text-sm text-slate-300"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-200" /> Research OS is processing your question...</div><p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">Synchronous workflow · this may take several minutes</p></div>}
              {error && <div role="alert" className="mt-5 border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
            </div>
            {!loading && <div className="border-t border-white/10 bg-[#0b111b] p-6"><p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-600">Try a starting point</p><div className="space-y-2">{examples.map((item) => <button key={item} type="button" onClick={() => { setQuery(item); handleSearch(item); }} className="group flex w-full items-center justify-between border-b border-white/5 py-2 text-left text-sm text-slate-400 transition hover:text-white"><span>{item}</span><span className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-200">↗</span></button>)}</div></div>}
          </div>
        </section>

        <section id="how-it-works" className="section-rule mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow mb-4">The research loop</p><h2 className="display text-4xl text-white sm:text-5xl">From open question<br />to defensible report.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Every stage leaves a trace. The workspace makes the system legible while the backend does the slow, careful work.</p></div><div className="grid border-l border-white/10 md:grid-cols-5 md:border-l-0">{stages.map(([number, title, description], index) => <div key={title} className="relative border-b border-white/10 p-5 pl-7 md:border-b-0 md:border-l md:pl-6"><span className="font-mono text-xs text-cyan-200">{number}</span><h3 className="mt-10 text-sm font-semibold tracking-widest text-white">{title}</h3><p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>{index < stages.length - 1 && <span className="absolute bottom-5 right-5 hidden text-slate-700 md:block">→</span>}</div>)}</div></section>

        <section id="technology" className="section-rule mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="eyebrow mb-4">Under the hood</p><h2 className="display text-4xl text-white">A serious stack for serious questions.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-500">Research OS keeps model providers behind an AI Gateway, combines semantic and graph retrieval, and persists the workflow as it runs.</p></div><div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">{technologies.map(([name, description]) => <div key={name} className="bg-[#0b111b] p-6 transition hover:bg-[#111a27]"><p className="font-mono text-xs text-cyan-200">{name}</p><p className="mt-4 text-sm leading-6 text-slate-400">{description}</p></div>)}</div></div><div className="mt-16 overflow-x-auto border border-white/10 bg-[#0b111b] p-6"><div className="min-w-[720px] font-mono text-xs text-slate-400"><div className="mx-auto w-fit border border-cyan-200/30 px-5 py-3 text-cyan-100">USER / RESEARCH API</div><div className="mx-auto h-8 w-px bg-cyan-200/30" /><div className="mx-auto w-fit border border-white/15 px-5 py-3 text-white">WORKFLOW ENGINE</div><div className="mx-auto h-8 w-px bg-cyan-200/30" /><div className="flex items-center justify-center gap-3"><span className="border border-white/10 px-5 py-3">PLANNER</span><span className="text-cyan-200">+</span><span className="border border-white/10 px-5 py-3">RESEARCH / MEMORY</span><span className="text-cyan-200">+</span><span className="border border-white/10 px-5 py-3">QDRANT / NEO4J</span></div><div className="mx-auto h-8 w-px bg-cyan-200/30" /><div className="mx-auto w-fit border border-white/15 px-5 py-3 text-white">WRITER → EVALUATOR → FINAL REPORT</div></div></div></section>

        <section id="about" className="section-rule mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1fr_0.8fr] lg:px-8"><div><p className="eyebrow mb-4">Built with intent</p><h2 className="display text-4xl text-white">A research instrument,<br />not a chat window.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">Research OS is built by Avimanyu Goswami as an AI / ML engineering project exploring orchestration, retrieval, knowledge graphs, and evaluation as one coherent product.</p></div><div className="border border-white/10 bg-[#0b111b] p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Project status</p><p className="mt-5 text-2xl font-semibold text-white">Research OS</p><p className="mt-2 text-sm text-slate-500">AI / ML Engineer · Researcher · Developer</p><div className="mt-8 border-t border-white/10 pt-4 font-mono text-xs text-cyan-200">No fabricated profile data</div></div></section>

        <section className="section-rule mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="border border-white/10 bg-[#0b111b] p-7 sm:p-10"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow mb-4">If Research OS becomes a product</p><h2 className="text-2xl font-semibold text-white">Conceptual pricing only.</h2><p className="mt-3 text-sm text-slate-500">Research OS is not currently claiming these commercial plans.</p></div><div className="grid gap-4 sm:grid-cols-3">{[['Free','$0'],['Pro','$15'],['Research','$49']].map(([name, price]) => <div key={name} className="min-w-28 border-l border-white/10 pl-4"><p className="text-xs text-slate-500">{name}</p><p className="mt-2 text-xl font-semibold text-white">{price}<span className="text-xs font-normal text-slate-600"> / mo</span></p></div>)}</div></div></div></section>
      </main>

      <footer className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span className="font-semibold text-slate-300">Research OS</span><span>An AI research workspace for turning questions into evidence-backed intelligence.</span><span>Built with AI, research, and a lot of debugging.</span></div></footer>
    </div>
  );
}
