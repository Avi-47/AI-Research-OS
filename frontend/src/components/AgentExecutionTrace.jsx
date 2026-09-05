import { useState } from 'react';

const order = [
  'planner-agent',
  'research-agent',
  'graph-builder-agent',
  'writer-agent',
  'evaluation-agent',
];

const roles = {
  'planner-agent': 'PLANNER',
  'research-agent': 'RESEARCH',
  'graph-builder-agent': 'GRAPH',
  'writer-agent': 'WRITER',
  'evaluation-agent': 'EVALUATION',
};

const descriptions = {
  'planner-agent': 'Generated research topics',
  'research-agent': 'Collected evidence and context',
  'graph-builder-agent': 'Extracted entities and relationships',
  'writer-agent': 'Generated the research report',
  'evaluation-agent': 'Quality evaluation completed',
};

export default function AgentExecutionTrace({ research }) {
  const traces = Array.isArray(research?.traces) ? research.traces : [];
  const results = Array.isArray(research?.agentResults)
    ? research.agentResults
    : [];

  const [open, setOpen] = useState(null);

  const agents = [...traces].sort(
    (a, b) =>
      (order.indexOf(a.agentId) + 99) -
      (order.indexOf(b.agentId) + 99)
  );

  if (!agents.length) {
    return (
      <div className="grid min-h-56 place-items-center border border-dashed border-white/10 p-8 text-center">
        <p className="text-sm font-medium text-slate-400">
          Agent execution data is unavailable for this run.
        </p>
      </div>
    );
  }

  const color = (status) => {
    const colors = {
      COMPLETED: 'text-emerald-300',
      FAILED: 'text-rose-300',
      RUNNING: 'text-cyan-200',
      QUEUED: 'text-amber-300',
      PENDING: 'text-slate-400',
    };

    return colors[status] || 'text-slate-300';
  };

  const iconStyle = (status) => {
    const styles = {
      COMPLETED:
        'border-emerald-400/30 bg-emerald-400/5 text-emerald-300',
      FAILED:
        'border-rose-400/30 bg-rose-400/5 text-rose-300',
      RUNNING:
        'border-cyan-400/30 bg-cyan-400/5 text-cyan-200',
      QUEUED:
        'border-amber-400/30 bg-amber-400/5 text-amber-300',
      PENDING:
        'border-white/10 bg-white/[0.02] text-slate-400',
    };

    return styles[status] || styles.PENDING;
  };

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">
            Execution trace
          </p>

          <h2 className="text-xl font-semibold text-white">
            Recorded agent activity
          </h2>
        </div>

        <span className="font-mono text-sm font-medium text-slate-400">
          {agents.length} traces
        </span>
      </div>

      {/* Agent traces */}
      {agents.map((trace, index) => {
        const result = results[index];
        const isOpen = open === trace.traceId;

        return (
          <article
            key={
              trace.traceId ||
              `${trace.agentId}-${index}`
            }
            className="border border-white/10 bg-[#0b111b] transition-colors hover:border-white/15"
          >

            {/* Agent header */}
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() =>
                setOpen(
                  isOpen
                    ? null
                    : trace.traceId
                )
              }
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:p-6"
            >

              {/* Status icon */}
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center border font-mono text-base font-bold ${iconStyle(
                  trace.status
                )}`}
              >
                {trace.status === 'COMPLETED'
                  ? '✓'
                  : trace.status === 'FAILED'
                  ? '!'
                  : '·'}
              </span>

              {/* Agent information */}
              <span className="min-w-0 flex-1">

                <span className="block text-base font-semibold text-white">
                  {trace.agentName ||
                    trace.agentId}
                </span>

                <span className="mt-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  {roles[trace.agentId] ||
                    'AGENT'}{' '}
                  · step{' '}
                  {trace.executionOrder ??
                    '—'}
                </span>

              </span>

              {/* Status + duration */}
              <span className="hidden text-right sm:block">

                <span
                  className={`block font-mono text-xs font-bold uppercase tracking-wide ${color(
                    trace.status
                  )}`}
                >
                  {trace.status ||
                    'UNAVAILABLE'}
                </span>

                <span className="mt-1.5 block font-mono text-xs font-medium text-slate-300">
                  {trace.durationMs
                    ? `${(
                        trace.durationMs /
                        1000
                      ).toFixed(1)}s`
                    : 'duration unavailable'}
                </span>

              </span>

              {/* Expand icon */}
              <span className="ml-2 text-lg font-light text-slate-400">
                {isOpen ? '−' : '+'}
              </span>

            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-white/10 px-5 pb-6 pl-16 sm:pl-16">

                {/* Description */}
                <p className="pt-5 text-sm font-medium leading-6 text-slate-200">
                  {descriptions[
                    trace.agentId
                  ] ||
                    'No output summary was returned.'}
                </p>

                {/* Error */}
                {trace.error && (
                  <div className="mt-4 border border-rose-400/20 bg-rose-400/5 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-rose-300">
                      Error
                    </p>

                    <p className="text-sm leading-6 text-rose-200">
                      {trace.error
                        .message ||
                        String(
                          trace.error
                        )}
                    </p>
                  </div>
                )}

                {/* JSON result */}
                {result && (
                  <div className="mt-5">

                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Agent output
                      </span>

                      <span className="font-mono text-xs text-amber-300">
                        JSON
                      </span>
                    </div>

                    <pre className="max-h-72 overflow-auto border border-amber-400/20 bg-[#070a10] p-4 font-mono text-xs leading-6 text-amber-200 shadow-inner">
                      {JSON.stringify(
                        result,
                        null,
                        2
                      )}
                    </pre>

                  </div>
                )}

              </div>
            )}
          </article>
        );
      })}

      {/* Summary statistics */}
      <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-4">

        {/* Completed */}
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-slate-400">
            Completed
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {
              agents.filter(
                (item) =>
                  item.status ===
                  'COMPLETED'
              ).length
            }
          </p>
        </div>

        {/* Failed */}
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-slate-400">
            Failed
          </p>

          <p className="mt-2 text-2xl font-bold text-rose-300">
            {
              agents.filter(
                (item) =>
                  item.status ===
                  'FAILED'
              ).length
            }
          </p>
        </div>

        {/* Recorded */}
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-slate-400">
            Recorded
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {agents.length}
          </p>
        </div>

        {/* Duration */}
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-slate-400">
            Duration
          </p>

          <p className="mt-2 text-2xl font-bold text-cyan-200">
            {research?.summary
              ?.totalDurationMs
              ? `${Math.round(
                  research.summary
                    .totalDurationMs /
                    1000
                )}s`
              : '—'}
          </p>
        </div>

      </div>
    </div>
  );
}
