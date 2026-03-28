import { SEVERITY_CONFIG } from "./SchemaBlock";

export default function IssueCard({ issue, revealed, onRevealHint, onRevealFull }) {
  const sev = SEVERITY_CONFIG[issue.severity];
  return (
    <div style={{
      background: revealed === "full" ? sev.bg : "rgba(255,255,255,0.02)",
      border: `1px solid ${revealed === "full" ? sev.border : "rgba(255,255,255,0.06)"}`,
      borderRadius: "8px",
      padding: "16px 20px",
      transition: "all 0.25s ease"
    }}>
      {revealed === "full" ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`,
              padding: "2px 8px", borderRadius: "4px"
            }}>{sev.label}</span>
            <span style={{
              fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)"
            }}>{issue.category}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "rgba(255,255,255,0.9)", marginBottom: "8px" }}>
            {issue.title}
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
            {issue.explanation}
          </div>
        </div>
      ) : revealed === "hint" ? (
        <div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", lineHeight: 1.6 }}>
            <span style={{ color: "#f59e0b", fontWeight: 600, marginRight: "6px" }}>Hint:</span>
            {issue.hint}
          </div>
          <button onClick={onRevealFull} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: "6px",
            fontSize: "12px", cursor: "pointer", fontWeight: 500
          }}>
            Reveal issue
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", flexShrink: 0
          }} />
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", flex: 1 }}>
            Hidden issue
          </span>
          <button onClick={onRevealHint} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.45)", padding: "5px 12px", borderRadius: "6px",
            fontSize: "11px", cursor: "pointer", fontWeight: 500
          }}>
            Get hint
          </button>
          <button onClick={onRevealFull} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.45)", padding: "5px 12px", borderRadius: "6px",
            fontSize: "11px", cursor: "pointer", fontWeight: 500
          }}>
            Reveal
          </button>
        </div>
      )}
    </div>
  );
}
