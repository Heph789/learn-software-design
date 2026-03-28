export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  major: { label: "Major", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  moderate: { label: "Moderate", color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)" }
};

interface SchemaBlockProps {
  sql: string;
}

export default function SchemaBlock({ sql }: SchemaBlockProps) {
  return (
    <pre style={{
      background: "#0c0c0c",
      color: "#c5c8c6",
      padding: "20px 24px",
      borderRadius: "8px",
      fontSize: "13px",
      lineHeight: "1.65",
      overflowX: "auto",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      border: "1px solid rgba(255,255,255,0.06)",
      margin: 0
    }}>
      {sql.split('\n').map((line, i) => {
        const highlighted = line
          .replace(/\b(CREATE TABLE|PRIMARY KEY|AUTO_INCREMENT|NOT NULL|DEFAULT|FOREIGN KEY|REFERENCES|UNIQUE|ENUM|BOOLEAN|INT|BIGINT|VARCHAR|TEXT|LONGTEXT|DATE|DATETIME|TIME|TIMESTAMP|DECIMAL|CURRENT_TIMESTAMP)\b/gi,
            m => `<kw>${m}</kw>`)
          .replace(/(--.*)/g, '<cm>$1</cm>');
        return (
          <div key={i} style={{ minHeight: "20px" }}
            dangerouslySetInnerHTML={{
              __html: highlighted
                .replace(/<kw>/g, '<span style="color:#b294bb">')
                .replace(/<\/kw>/g, '</span>')
                .replace(/<cm>/g, '<span style="color:#5a5a5a;font-style:italic">')
                .replace(/<\/cm>/g, '</span>')
            }}
          />
        );
      })}
    </pre>
  );
}
