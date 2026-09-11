import React, { useState } from 'react';

export default function CopyButton({ text, label = 'Copy command' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without clipboard API / insecure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button className="btn btn-secondary" onClick={handleCopy} type="button">
      {copied ? '✓ Copied' : label}
    </button>
  );
}
