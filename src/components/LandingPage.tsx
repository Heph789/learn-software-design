import SCENARIOS from "../data/scenarios";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const totalIssues = SCENARIOS.reduce((sum, s) => sum + s.issues.length, 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "80vh", textAlign: "center",
      padding: "40px 20px"
    }}>
      <div style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", marginBottom: "12px"
      }}>
        Schema Review Practice
      </div>
      <h1 style={{
        fontSize: "28px", fontWeight: 700, margin: "0 0 12px",
        color: "rgba(255,255,255,0.95)", letterSpacing: "-0.01em"
      }}>
        What's wrong with this schema?
      </h1>
      <p style={{
        fontSize: "15px", color: "rgba(255,255,255,0.45)", margin: "0 0 32px",
        lineHeight: 1.6, maxWidth: "440px"
      }}>
        Practice spotting design issues in SQL schemas. Study the DDL, write down every problem you can find, then reveal the answers to check your work.
      </p>
      <button onClick={onStart} style={{
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.9)", padding: "12px 32px", borderRadius: "8px",
        fontSize: "15px", fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s ease"
      }}>
        Start Practicing
      </button>
      <div style={{
        marginTop: "16px", fontSize: "13px", color: "rgba(255,255,255,0.3)"
      }}>
        {SCENARIOS.length} scenarios · {totalIssues} issues
      </div>
    </div>
  );
}
