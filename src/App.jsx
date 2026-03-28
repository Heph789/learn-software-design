import { useState, useCallback } from "react";
import SCENARIOS from "./data/scenarios";
import SchemaBlock from "./components/SchemaBlock";
import IssueCard from "./components/IssueCard";

export default function App() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [revealState, setRevealState] = useState({});
  const [userNotes, setUserNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesSubmitted, setNotesSubmitted] = useState(false);

  const scenario = SCENARIOS[currentScenario];
  const stateKey = (issueIdx) => `${scenario.id}-${issueIdx}`;
  const revealedCount = scenario.issues.filter((_, i) => revealState[stateKey(i)] === "full").length;

  const revealHint = useCallback((i) => {
    setRevealState(s => ({ ...s, [`${scenario.id}-${i}`]: "hint" }));
  }, [scenario.id]);

  const revealFull = useCallback((i) => {
    setRevealState(s => ({ ...s, [`${scenario.id}-${i}`]: "full" }));
  }, [scenario.id]);

  const revealAll = useCallback(() => {
    const updates = {};
    scenario.issues.forEach((_, i) => { updates[`${scenario.id}-${i}`] = "full"; });
    setRevealState(s => ({ ...s, ...updates }));
  }, [scenario.id, scenario.issues]);

  const goTo = useCallback((idx) => {
    setCurrentScenario(idx);
    setUserNotes("");
    setShowNotes(false);
    setNotesSubmitted(false);
  }, []);

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
      background: "#111111",
      color: "rgba(255,255,255,0.85)",
      minHeight: "100vh",
      padding: "32px 20px"
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", marginBottom: "8px"
          }}>
            Schema Review Practice
          </div>
          <h1 style={{
            fontSize: "22px", fontWeight: 700, margin: 0, color: "rgba(255,255,255,0.95)",
            letterSpacing: "-0.01em"
          }}>
            What's wrong with this schema?
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "6px 0 0", lineHeight: 1.5 }}>
            Read the product context and SQL, write down every issue you can spot, then reveal to check.
          </p>
        </div>

        {/* Scenario nav */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
          {SCENARIOS.map((s, i) => {
            const done = s.issues.every((_, j) => revealState[`${s.id}-${j}`] === "full");
            return (
              <button key={s.id} onClick={() => goTo(i)} style={{
                padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                border: i === currentScenario ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                background: i === currentScenario ? "rgba(255,255,255,0.08)" : "transparent",
                color: done ? "rgba(255,255,255,0.3)" : i === currentScenario ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                textDecoration: done ? "line-through" : "none",
                transition: "all 0.15s ease"
              }}>
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Context */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px", padding: "16px 20px", marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: "8px"
          }}>
            Product Context
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.65 }}>
            {scenario.context}
          </p>
        </div>

        {/* Schema */}
        <div style={{ marginBottom: "24px" }}>
          <SchemaBlock sql={scenario.schema} />
        </div>

        {/* Your analysis area */}
        <div style={{ marginBottom: "28px" }}>
          {!showNotes && !notesSubmitted && (
            <button onClick={() => setShowNotes(true)} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", padding: "10px 20px", borderRadius: "8px",
              fontSize: "13px", cursor: "pointer", fontWeight: 500, width: "100%",
              transition: "all 0.15s ease"
            }}>
              Write your analysis before revealing issues
            </button>
          )}
          {showNotes && !notesSubmitted && (
            <div>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="List every issue you can spot: missing constraints, normalization problems, things that won't scale, missing tables for planned features..."
                style={{
                  width: "100%", minHeight: "120px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                  padding: "14px 16px", fontSize: "13px", color: "rgba(255,255,255,0.8)",
                  fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                  boxSizing: "border-box", outline: "none"
                }}
              />
              <button onClick={() => setNotesSubmitted(true)} style={{
                marginTop: "8px", background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)", padding: "8px 18px", borderRadius: "6px",
                fontSize: "12px", cursor: "pointer", fontWeight: 600
              }}>
                Done — show me the issues
              </button>
            </div>
          )}
          {notesSubmitted && userNotes && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px", padding: "14px 18px"
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: "6px"
              }}>Your analysis</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {userNotes}
              </div>
            </div>
          )}
        </div>

        {/* Issues */}
        <div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "14px"
          }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              {revealedCount} / {scenario.issues.length} issues revealed
            </div>
            {revealedCount < scenario.issues.length && (
              <button onClick={revealAll} style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                fontSize: "12px", cursor: "pointer", textDecoration: "underline",
                textUnderlineOffset: "3px"
              }}>
                Reveal all
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scenario.issues.map((issue, i) => (
              <IssueCard
                key={`${scenario.id}-${i}`}
                issue={issue}
                revealed={revealState[stateKey(i)] || "hidden"}
                onRevealHint={() => revealHint(i)}
                onRevealFull={() => revealFull(i)}
              />
            ))}
          </div>
        </div>

        {/* Score summary */}
        {revealedCount === scenario.issues.length && (
          <div style={{
            marginTop: "28px", padding: "18px 22px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px", textAlign: "center"
          }}>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
              All {scenario.issues.length} issues revealed
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              {scenario.issues.filter(i => i.severity === "critical").length} critical · {" "}
              {scenario.issues.filter(i => i.severity === "major").length} major · {" "}
              {scenario.issues.filter(i => i.severity === "moderate").length} moderate
            </div>
            {currentScenario < SCENARIOS.length - 1 && (
              <button onClick={() => goTo(currentScenario + 1)} style={{
                marginTop: "14px", background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)", padding: "9px 22px", borderRadius: "6px",
                fontSize: "13px", cursor: "pointer", fontWeight: 600
              }}>
                Next scenario
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
