import React, { useState } from 'react';
import { CHALLENGES } from '../data/challenges.js';
import { executeCommand } from '../api/index.js';
import { normalizeCommand } from '../../../shared/commandValidator.js';
import RiskBadge from './RiskBadge.jsx';

/**
 * Learning / Challenge mode. The user is given a task, types the command
 * they think solves it, and the app checks + runs it, then explains the lesson.
 */
export default function LearningMode() {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'incorrect'
  const [execution, setExecution] = useState(null);
  const [running, setRunning] = useState(false);

  const challenge = CHALLENGES[index];

  async function handleSubmit(e) {
    e.preventDefault();
    const normalized = normalizeCommand(input);
    if (!normalized) return;

    const correct = normalized === challenge.expected;
    setStatus(correct ? 'correct' : 'incorrect');

    if (correct) {
      setRunning(true);
      setExecution(null);
      try {
        const result = await executeCommand({ command: normalized });
        setExecution(result);
      } catch (err) {
        setExecution({ success: false, stderr: err.message, command: normalized });
      } finally {
        setRunning(false);
      }
    }
  }

  function nextChallenge() {
    setIndex((i) => (i + 1) % CHALLENGES.length);
    setInput('');
    setStatus(null);
    setExecution(null);
  }

  return (
    <section className="panel learning" aria-label="Learning mode">
      <div className="panel-header">
        <h2>🎓 Learning Mode</h2>
        <span className="challenge-count">
          Challenge {index + 1} / {CHALLENGES.length}
        </span>
      </div>

      <div className="challenge">
        <h3>{challenge.title}</h3>
        <p className="challenge-prompt">{challenge.prompt}</p>

        <form onSubmit={handleSubmit} className="challenge-form">
          <input
            className="text-input mono"
            placeholder="Type the AWS CLI command…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-label="Your command"
          />
          <button className="btn btn-primary" type="submit">Check &amp; Run</button>
        </form>

        {status === 'incorrect' && (
          <div className="feedback feedback-error">
            Not quite. Hint: the expected command starts with <code>{challenge.expected.split(' ').slice(0, 2).join(' ')}</code>. Try again.
          </div>
        )}

        {status === 'correct' && (
          <div className="feedback feedback-success">
            ✓ Correct! <RiskBadge risk="LOW / READ ONLY" />
          </div>
        )}

        {running && <p className="challenge-running">Running your command…</p>}

        {execution && execution.success && (
          <>
            <pre className="terminal-body small">{execution.stdout}</pre>
            <div className="lesson">
              <strong>What you learned:</strong> {challenge.lesson}
            </div>
            <button className="btn btn-secondary" onClick={nextChallenge} type="button">
              Next challenge →
            </button>
          </>
        )}
      </div>
    </section>
  );
}
