import React from 'react';
import RiskBadge from './RiskBadge.jsx';
import CopyButton from './CopyButton.jsx';

/**
 * Displays the full structured, teaching-focused command info:
 * command, explanation, breakdown, service, concept, risk, copy + execute.
 */
export default function CommandPanel({ result, onExecute, executing }) {
  if (!result) return null;

  return (
    <section className="panel command-panel" aria-label="Generated command">
      <div className="panel-header">
        <h2>Generated Command</h2>
        <RiskBadge risk={result.risk} />
      </div>

      <div className="command-line">
        <code>{result.command}</code>
      </div>

      <div className="command-actions">
        <CopyButton text={result.command} />
        {result.executable ? (
          <button
            className="btn btn-primary"
            onClick={onExecute}
            disabled={executing}
            type="button"
          >
            {executing ? 'Executing…' : '▶ Execute'}
          </button>
        ) : (
          <span className="not-executable" title="This command is not on the allowlist">
            Execution disabled (not on allowlist)
          </span>
        )}
      </div>

      <div className="detail-block">
        <h3>Explanation</h3>
        <p>{result.explanation}</p>
      </div>

      <div className="detail-block">
        <h3>Command Breakdown</h3>
        <ul className="breakdown">
          {result.breakdown?.map((item) => (
            <li key={item.token}>
              <code>{item.token}</code>
              <span className="arrow">→</span>
              <span>{item.meaning}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="detail-grid">
        <div className="detail-block">
          <h3>AWS Service</h3>
          <p>{result.service}</p>
        </div>
        <div className="detail-block">
          <h3>AWS Concept</h3>
          <p>{result.concept}</p>
        </div>
      </div>
    </section>
  );
}
