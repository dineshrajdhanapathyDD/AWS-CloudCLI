import React, { useState } from 'react';
import { AWS_SERVICES } from './data/services.js';
import { generateCommand, executeCommand, IS_MOCK } from './api/index.js';
import CommandPanel from './components/CommandPanel.jsx';
import TerminalOutput from './components/TerminalOutput.jsx';
import LearningMode from './components/LearningMode.jsx';

const TABS = { BUILD: 'build', LEARN: 'learn' };

export default function App() {
  const [tab, setTab] = useState(TABS.BUILD);
  const [service, setService] = useState(AWS_SERVICES[0].id);
  const [prompt, setPrompt] = useState('');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState(null);

  const selectedService = AWS_SERVICES.find((s) => s.id === service);

  async function handleGenerate(e) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    setExecution(null);

    if (!prompt.trim()) {
      setError('Please describe what you want to accomplish.');
      return;
    }

    setGenerating(true);
    try {
      const res = await generateCommand({ service, prompt });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Something went wrong generating the command.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExecute() {
    if (!result?.command) return;
    setExecuting(true);
    setExecution(null);
    try {
      const res = await executeCommand({ command: result.command });
      setExecution(res);
    } catch (err) {
      setExecution({ success: false, stderr: err.message, command: result.command });
    } finally {
      setExecuting(false);
    }
  }

  function useExample() {
    setPrompt(selectedService?.examplePrompt || '');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">⌘</span>
          <div>
            <h1>AWS CloudCLI</h1>
            <p className="tagline">Ask. Understand. Execute. Learn AWS.</p>
          </div>
        </div>
        {IS_MOCK && <span className="mode-badge" title="Running with mocked AI responses">MOCK MODE</span>}
      </header>

      <nav className="tabs">
        <button
          className={`tab ${tab === TABS.BUILD ? 'active' : ''}`}
          onClick={() => setTab(TABS.BUILD)}
          type="button"
        >
          Build a Command
        </button>
        <button
          className={`tab ${tab === TABS.LEARN ? 'active' : ''}`}
          onClick={() => setTab(TABS.LEARN)}
          type="button"
        >
          Learning Mode
        </button>
      </nav>

      <main className="app-main">
        {tab === TABS.BUILD ? (
          <>
            <section className="panel input-panel">
              <form onSubmit={handleGenerate}>
                <label className="field">
                  <span className="field-label">AWS Service</span>
                  <select
                    className="select"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    aria-label="Select AWS service"
                  >
                    {AWS_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                {selectedService && (
                  <p className="service-desc">
                    {selectedService.description}
                    {selectedService.executable === false && (
                      <span className="teach-badge" title="CloudCLI generates and explains a real command; execution stays limited to the read-only allowlist">
                        Teaching mode
                      </span>
                    )}
                  </p>
                )}

                <label className="field">
                  <span className="field-label">What do you want to do?</span>
                  <textarea
                    className="text-input textarea"
                    rows={3}
                    placeholder={selectedService?.examplePrompt || 'Describe your task in plain English…'}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </label>

                <div className="input-actions">
                  <button className="btn btn-link" type="button" onClick={useExample}>
                    Use example
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={generating}>
                    {generating ? 'Generating…' : 'Generate CLI Command'}
                  </button>
                </div>
              </form>
            </section>

            {/* Empty state */}
            {!generating && !result && !error && (
              <div className="empty-state">
                <p>Select a service, describe your task, and generate a safe AWS CLI command with a full explanation.</p>
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div className="loading-state">
                <div className="spinner" /> Generating a safe command…
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="error-state" role="alert">
                <strong>⚠ Error:</strong> {error}
              </div>
            )}

            {/* Result */}
            <CommandPanel result={result} onExecute={handleExecute} executing={executing} />
            <TerminalOutput execution={execution} executing={executing} />
          </>
        ) : (
          <LearningMode />
        )}
      </main>

      <footer className="app-footer">
        <span>Built by DD</span>
        <span>Read-only allowlist · No shell execution · No credentials in browser</span>
      </footer>
    </div>
  );
}
