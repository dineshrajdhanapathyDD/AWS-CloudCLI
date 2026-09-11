import React from 'react';

/**
 * Terminal-style output panel. Handles execution, success and error states.
 */
export default function TerminalOutput({ execution, executing }) {
  if (executing) {
    return (
      <section className="panel terminal" aria-label="Terminal output">
        <div className="terminal-header"><span className="dot red" /><span className="dot yellow" /><span className="dot green" /> output</div>
        <pre className="terminal-body loading">$ running command…</pre>
      </section>
    );
  }

  if (!execution) return null;

  const { success, stdout, stderr, command, explanation } = execution;

  return (
    <section className="panel terminal" aria-label="Terminal output">
      <div className="terminal-header">
        <span className="dot red" /><span className="dot yellow" /><span className="dot green" /> output
      </div>
      <pre className="terminal-body">
        <span className="prompt">$ {command}</span>
        {'\n'}
        {success ? (
          <span className="stdout">{stdout}</span>
        ) : (
          <span className="stderr">✕ {stderr}</span>
        )}
      </pre>
      {success && explanation && (
        <div className="output-explanation">
          <strong>What this means:</strong> {explanation}
        </div>
      )}
    </section>
  );
}
