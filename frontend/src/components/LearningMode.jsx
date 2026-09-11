import React, { useState } from 'react';
import { QUIZ } from '../data/quiz.js';

/**
 * Learning Mode — an AWS CLI knowledge quiz.
 *
 * The user answers multiple-choice questions. Every answer reveals an
 * explanation so they learn from each click, and a running score is tracked.
 * At the end they get a summary and can retry.
 */
export default function LearningMode() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // chosen option index
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = QUIZ.length;
  const q = QUIZ[index];

  function choose(optionIndex) {
    if (answered) return; // lock after first answer
    setSelected(optionIndex);
    setAnswered(true);
    if (optionIndex === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct === 100 ? 'Perfect score! You know your AWS CLI.' :
      pct >= 70 ? 'Great work — solid AWS CLI fundamentals.' :
      pct >= 40 ? 'Good start. Review the explanations and try again.' :
      'Keep practicing — every command teaches you something.';
    return (
      <section className="panel learning" aria-label="Quiz results">
        <div className="panel-header">
          <h2>🎓 Quiz Complete</h2>
        </div>
        <div className="quiz-result">
          <div className="quiz-score-big">{score} / {total}</div>
          <div className="quiz-score-pct">{pct}%</div>
          <p>{message}</p>
          <button className="btn btn-primary" onClick={restart} type="button">
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel learning" aria-label="Learning quiz">
      <div className="panel-header">
        <h2>🎓 Learning Mode — Quiz</h2>
        <span className="challenge-count">
          Question {index + 1} / {total} · Score {score}
        </span>
      </div>

      <div className="quiz">
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${(index / total) * 100}%` }} />
        </div>

        <span className="quiz-tag">{q.service}</span>
        <h3 className="quiz-question">{q.question}</h3>

        <ul className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (answered) {
              if (i === q.answer) cls += ' correct';
              else if (i === selected) cls += ' incorrect';
              else cls += ' dimmed';
            }
            return (
              <li key={i}>
                <button
                  className={cls}
                  onClick={() => choose(i)}
                  disabled={answered}
                  type="button"
                >
                  <code className="mono">{opt}</code>
                  {answered && i === q.answer && <span className="mark">✓</span>}
                  {answered && i === selected && i !== q.answer && <span className="mark">✕</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {answered && (
          <>
            <div className={`feedback ${selected === q.answer ? 'feedback-success' : 'feedback-error'}`}>
              {selected === q.answer ? '✓ Correct!' : '✕ Not quite.'}
            </div>
            <div className="lesson">
              <strong>Why:</strong> {q.explanation}
            </div>
            <button className="btn btn-primary" onClick={next} type="button">
              {index + 1 >= total ? 'See results' : 'Next question →'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
