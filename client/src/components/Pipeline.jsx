import { useEffect, useState } from 'react';

const STAGES = ['Classify', 'Analyze evidence', 'Retrieve policy', 'Recommend', 'Human review'];

// status: 'running' | 'completed' | 'failed' | undefined
export default function Pipeline({ status }) {
  const [step, setStep] = useState(0);

  // While the AI is working, move the highlight through the first four stages.
  useEffect(() => {
    if (status !== 'running') return;
    setStep(0);
    const t = setInterval(() => setStep(s => Math.min(s + 1, 3)), 3000);
    return () => clearInterval(t);
  }, [status]);

  function stateFor(i) {
    if (status === 'completed') return i < 4 ? 'done' : 'active';
    if (status === 'running') return i < step ? 'done' : i === step ? 'active' : 'pending';
    return 'pending';
  }

  return (
    <div className="pipeline">
      {STAGES.map((s, i) => {
        const st = stateFor(i);
        return (
          <div key={s} className={`stage ${st}`}>
            <span className="stage-num">{st === 'done' ? '✓' : i + 1}</span>
            {s}
          </div>
        );
      })}
    </div>
  );
}