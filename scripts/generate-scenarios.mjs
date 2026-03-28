import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SCENARIOS_DIR = join(ROOT, "scenarios");
const OUTPUT = join(ROOT, "src", "data", "scenarios.ts");

const VALID_SEVERITIES = ["critical", "major", "moderate"];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: content };
  const body = content.slice(match[0].length).trim();
  const data = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) data[m[1]] = m[2];
  }
  return { data, body };
}

function parseScenarioFile(filepath) {
  const filename = filepath.split("/").pop();
  const id = filename.replace(/\.md$/, "");

  const raw = readFileSync(filepath, "utf-8");
  const { data, body } = parseFrontmatter(raw);

  if (!data.title) throw new Error(`${filename}: missing 'title' in frontmatter`);

  const difficulty = parseInt(data.difficulty, 10);
  if (isNaN(difficulty) || difficulty < 1 || difficulty > 3) {
    throw new Error(`${filename}: 'difficulty' must be 1, 2, or 3 (got "${data.difficulty}")`);
  }

  // Split on ## headings
  const sections = {};
  let currentSection = null;
  for (const line of body.split("\n")) {
    const headingMatch = line.match(/^## (.+)/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim();
      sections[currentSection] = "";
    } else if (currentSection) {
      sections[currentSection] += line + "\n";
    }
  }

  if (!sections["Context"]) throw new Error(`${filename}: missing ## Context section`);
  if (!sections["Schema"]) throw new Error(`${filename}: missing ## Schema section`);
  if (!sections["Issues"]) throw new Error(`${filename}: missing ## Issues section`);

  const context = sections["Context"].trim();

  // Extract SQL from fenced code block
  const sqlMatch = sections["Schema"].match(/```sql\n([\s\S]*?)```/);
  if (!sqlMatch) throw new Error(`${filename}: missing \`\`\`sql code block in ## Schema`);
  const schema = sqlMatch[1].trimEnd();

  // Parse issues
  const issueBlocks = sections["Issues"].split(/^### Issue: /m).filter((b) => b.trim());
  if (issueBlocks.length === 0) throw new Error(`${filename}: no issues found`);

  const issues = issueBlocks.map((block) => {
    const lines = block.split("\n");
    const title = lines[0].trim();

    const categoryMatch = block.match(/\*\*Category:\*\*\s*(.+)/);
    const severityMatch = block.match(/\*\*Severity:\*\*\s*(.+)/);
    const hintMatch = block.match(/\*\*Hint:\*\*\s*(.+)/);

    if (!categoryMatch) throw new Error(`${filename}, issue "${title}": missing Category`);
    if (!severityMatch) throw new Error(`${filename}, issue "${title}": missing Severity`);
    if (!hintMatch) throw new Error(`${filename}, issue "${title}": missing Hint`);

    const severity = severityMatch[1].trim();
    if (!VALID_SEVERITIES.includes(severity)) {
      throw new Error(`${filename}, issue "${title}": invalid severity "${severity}" (must be ${VALID_SEVERITIES.join(", ")})`);
    }

    // Explanation is everything after the bullet list
    const bulletEnd = block.lastIndexOf("**Hint:**");
    const afterHint = block.slice(bulletEnd);
    const hintLineEnd = afterHint.indexOf("\n");
    const explanation = afterHint.slice(hintLineEnd).trim();

    if (!explanation) throw new Error(`${filename}, issue "${title}": missing explanation`);

    return {
      category: categoryMatch[1].trim(),
      severity,
      title,
      explanation,
      hint: hintMatch[1].trim(),
    };
  });

  return { id, title: data.title, difficulty, context, schema, issues };
}

function escapeForTemplate(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function escapeForDoubleQuote(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function generateTS(scenarios) {
  let out = `// AUTO-GENERATED from scenarios/*.md — do not edit by hand.
// Run "npm run generate" to regenerate.

export interface Issue {
  category: string;
  severity: "critical" | "major" | "moderate";
  title: string;
  explanation: string;
  hint: string;
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: number;
  context: string;
  schema: string;
  issues: Issue[];
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

const SCENARIOS: Scenario[] = [\n`;

  for (const s of scenarios) {
    out += `  {\n`;
    out += `    id: "${escapeForDoubleQuote(s.id)}",\n`;
    out += `    title: "${escapeForDoubleQuote(s.title)}",\n`;
    out += `    difficulty: ${s.difficulty},\n`;
    out += `    context: "${escapeForDoubleQuote(s.context)}",\n`;
    out += `    schema: \`${escapeForTemplate(s.schema)}\`,\n`;
    out += `    issues: [\n`;
    for (const issue of s.issues) {
      out += `      {\n`;
      out += `        category: "${escapeForDoubleQuote(issue.category)}",\n`;
      out += `        severity: "${issue.severity}",\n`;
      out += `        title: "${escapeForDoubleQuote(issue.title)}",\n`;
      out += `        explanation: "${escapeForDoubleQuote(issue.explanation)}",\n`;
      out += `        hint: "${escapeForDoubleQuote(issue.hint)}"\n`;
      out += `      },\n`;
    }
    out += `    ]\n`;
    out += `  },\n`;
  }

  out += `];\n\nexport default SCENARIOS;\n`;
  return out;
}

// Main
const files = readdirSync(SCENARIOS_DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .sort()
  .map((f) => join(SCENARIOS_DIR, f));

if (files.length === 0) {
  console.error("Error: no scenario files found in scenarios/");
  process.exit(1);
}

const scenarios = [];
const seenIds = new Map();
let hasErrors = false;

for (const file of files) {
  try {
    const scenario = parseScenarioFile(file);
    if (seenIds.has(scenario.id)) {
      console.error(`Error: duplicate id ${scenario.id} in ${file} and ${seenIds.get(scenario.id)}`);
      hasErrors = true;
    }
    seenIds.set(scenario.id, file);
    scenarios.push(scenario);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    hasErrors = true;
  }
}

if (hasErrors) process.exit(1);

const output = generateTS(scenarios);
writeFileSync(OUTPUT, output);
console.log(`Generated ${OUTPUT} with ${scenarios.length} scenarios`);
