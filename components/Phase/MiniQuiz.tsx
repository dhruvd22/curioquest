"use client";
import { useState } from "react";

type QuizItem = { q: string; choices: string[]; answer: number };

export default function MiniQuiz({ items }: { items: QuizItem[] }) {
  const [selected, setSelected] = useState<number[]>(Array(items.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  const score = submitted ? selected.reduce((acc, val, i) => acc + (val === items[i].answer ? 1 : 0), 0) : 0;

  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-2">Quick Quiz</h3>
      {items.map((it, idx) => (
        <div key={idx} className="mb-3">
          <div className="mb-1">{it.q}</div>
          <div className="flex gap-2 flex-wrap">
            {it.choices.map((c, ci) => (
              <button
                key={ci}
                onClick={() => !submitted && setSelected(s => s.map((v, i) => i === idx ? ci : v))}
                className={`px-3 py-1 border rounded ${selected[idx]===ci ? "bg-gray-200" : ""}`}
                aria-pressed={selected[idx]===ci}
              >
                {c}
              </button>
            ))}
          </div>
          {submitted && selected[idx] !== -1 && (
            <div className="text-sm mt-1">
              {selected[idx] === it.answer ? "✅ Correct" : `❌ Try again (Answer: ${it.choices[it.answer]})`}
            </div>
          )}
        </div>
      ))}
      <button className="px-3 py-1 border rounded" onClick={() => setSubmitted(true)}>Check answers</button>
      {submitted && <div className="mt-2">Score: {score} / {items.length}</div>}
    </div>
  );
}
