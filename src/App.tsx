import { useState, useCallback, useMemo } from "react";
import SCENARIOS, { DIFFICULTY_LABELS } from "./data/scenarios";
import SchemaBlock from "./components/SchemaBlock";
import IssueCard from "./components/IssueCard";
import LandingPage from "./components/LandingPage";

type RevealState = Record<string, "hint" | "full">;

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#f59e0b",
  3: "#ef4444",
};

export default function App() {
  const [currentScenario, setCurrentScenario] = useState<number | null>(null);
  const [revealState, setRevealState] = useState<RevealState>({});
  const [userNotes, setUserNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesSubmitted, setNotesSubmitted] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  const filteredScenarios = useMemo(
    () => difficultyFilter === null ? SCENARIOS : SCENARIOS.filter(s => s.difficulty === difficultyFilter),
    [difficultyFilter]
  );

  const scenario = currentScenario !== null ? SCENARIOS[currentScenario] : null;
  const stateKey = (issueIdx: number) => `${scenario!.id}-${issueIdx}`;
  const revealedCount = scenario ? scenario.issues.filter((_, i) => revealState[stateKey(i)] === "full").length : 0;

  const revealHint = useCallback((i: number) => {
    if (!scenario) return;
    const id = scenario.id;
    setRevealState(s => ({ ...s, [`${id}-${i}`]: "hint" }));
  }, [scenario]);

  const revealFull = useCallback((i: number) => {
    if (!scenario) return;
    const id = scenario.id;
    setRevealState(s => ({ ...s, [`${id}-${i}`]: "full" }));
  }, [scenario]);

  const revealAll = useCallback(() => {
    if (!scenario) return;
    const updates: RevealState = {};
    scenario.issues.forEach((_, i) => { updates[`${scenario.id}-${i}`] = "full"; });
    setRevealState(s => ({ ...s, ...updates }));
  }, [scenario]);

  const goTo = useCallback((idx: number) => {
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
      {currentScenario === null || !scenario ? (
        <LandingPage onStart={() => goTo(0)} />
      ) : (
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <button onClick={() => setCurrentScenario(null)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.35)",
            fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "12px",
            textDecoration: "underline", textUnderlineOffset: "3px"
          }}>
            Back to home
          </button>
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

        {/* Difficulty filter */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button onClick={() => setDifficultyFilter(null)} style={{
            padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            border: difficultyFilter === null ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
            background: difficultyFilter === null ? "rgba(255,255,255,0.08)" : "transparent",
            color: difficultyFilter === null ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
            transition: "all 0.15s ease"
          }}>
            All
          </button>
          {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => {
            const n = parseInt(level, 10);
            const active = difficultyFilter === n;
            return (
              <button key={n} onClick={() => setDifficultyFilter(active ? null : n)} style={{
                padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                border: active ? `1px solid ${DIFFICULTY_COLORS[n]}40` : "1px solid rgba(255,255,255,0.08)",
                background: active ? `${DIFFICULTY_COLORS[n]}15` : "transparent",
                color: active ? DIFFICULTY_COLORS[n] : "rgba(255,255,255,0.4)",
                transition: "all 0.15s ease"
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Scenario nav */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
          {filteredScenarios.map((s) => {
            const idx = SCENARIOS.indexOf(s);
            const done = s.issues.every((_, j) => revealState[`${s.id}-${j}`] === "full");
            const active = idx === currentScenario;
            return (
              <button key={s.id} onClick={() => goTo(idx)} style={{
                padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: done ? "rgba(255,255,255,0.3)" : active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                textDecoration: done ? "line-through" : "none",
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", gap: "6px"
              }}>
                <span style={{
                  fontSize: "9px", fontWeight: 700,
                  color: DIFFICULTY_COLORS[s.difficulty],
                  opacity: done ? 0.4 : 0.7
                }}>
                  {DIFFICULTY_LABELS[s.difficulty]?.slice(0, 3).toUpperCase()}
                </span>
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
      )}
    </div>
  );
}
