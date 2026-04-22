const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const releaseBranch = process.argv[2];
const distRoot = path.join(repoRoot, "dist");
const siteRoot = path.join(repoRoot, "site");

if (!releaseBranch) {
  console.error("Usage: node scripts/build-from-branch.js <release-branch>");
  process.exit(1);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown, title, release, releaseBranchName) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }
    html.push(`<p>${inlineMarkdownToHtml(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (inList) {
      html.push("</ol>");
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = trimmed.match(/^\d+\.\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!inList) {
        html.push("<ol>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdownToHtml(listItem[1])}</li>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | ${escapeHtml(release)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fc;
      --panel: #ffffff;
      --text: #172033;
      --muted: #52607a;
      --accent: #0b5fff;
      --border: #d6dfef;
    }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(180deg, #f0f5ff 0%, var(--bg) 45%);
      color: var(--text);
    }
    main {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 20px 64px;
    }
    .shell {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px 28px;
      box-shadow: 0 12px 34px rgba(17, 36, 73, 0.08);
    }
    .meta {
      color: var(--muted);
      font-size: 0.95rem;
      margin-bottom: 18px;
    }
    a { color: var(--accent); text-decoration: none; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.2; }
    ol { padding-left: 22px; }
    code {
      background: #eef3fb;
      border-radius: 6px;
      padding: 2px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
  </style>
</head>
<body>
  <main>
    <div class="shell">
      <div class="meta">
        <a href="../index.html">All releases</a> ·
        <a href="./index.html">${escapeHtml(release)} index</a> ·
        Release branch: <code>${escapeHtml(releaseBranchName)}</code>
      </div>
      ${html.join("\n")}
    </div>
  </main>
</body>
</html>`;
}

function releaseIndexToHtml(indexMarkdown, release, releaseBranchName) {
  return markdownToHtml(indexMarkdown, `Release ${release}`, release, releaseBranchName);
}

function gitShow(branchPath) {
  return execFileSync("git", ["show", branchPath], { cwd: repoRoot, encoding: "utf8" });
}

function parseScalar(raw) {
  const trimmed = raw.trim();
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return JSON.parse(trimmed.replace(/'/g, '"'));
  }
  return trimmed;
}

function parseYamlBlock(lines, startIndex, currentIndent) {
  const result = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const indent = line.match(/^ */)[0].length;
    if (indent < currentIndent) break;
    if (indent > currentIndent) throw new Error(`Unexpected indentation in YAML near: ${line}`);

    const trimmed = line.trim();
    const keyValue = trimmed.match(/^([^:]+):(.*)$/);
    if (!keyValue) throw new Error(`Unsupported YAML line: ${line}`);

    const key = keyValue[1].trim();
    const rest = keyValue[2].trim();

    if (!rest) {
      const nextLine = lines[index + 1] || "";
      const nextTrimmed = nextLine.trim();
      const nextIndent = nextLine.match(/^ */)[0].length;

      if (nextTrimmed.startsWith("- ")) {
        const listResult = [];
        index += 1;
        while (index < lines.length) {
          const listLine = lines[index];
          const listIndent = listLine.match(/^ */)[0].length;
          const listTrimmed = listLine.trim();
          if (!listTrimmed) {
            index += 1;
            continue;
          }
          if (listIndent < currentIndent + 2 || !listTrimmed.startsWith("- ")) break;

          const itemValue = listTrimmed.slice(2).trim();
          if (itemValue.includes(":")) {
            const item = {};
            const firstMatch = itemValue.match(/^([^:]+):(.*)$/);
            item[firstMatch[1].trim()] = parseScalar(firstMatch[2].trim());
            index += 1;
            while (index < lines.length) {
              const nestedLine = lines[index];
              const nestedIndent = nestedLine.match(/^ */)[0].length;
              const nestedTrimmed = nestedLine.trim();
              if (!nestedTrimmed) {
                index += 1;
                continue;
              }
              if (nestedIndent <= listIndent) break;
              const nestedMatch = nestedTrimmed.match(/^([^:]+):(.*)$/);
              item[nestedMatch[1].trim()] = parseScalar(nestedMatch[2].trim());
              index += 1;
            }
            listResult.push(item);
            continue;
          }

          listResult.push(parseScalar(itemValue));
          index += 1;
        }
        result[key] = listResult;
        continue;
      }

      if (nextIndent > currentIndent) {
        const nested = parseYamlBlock(lines, index + 1, currentIndent + 2);
        result[key] = nested.value;
        index = nested.nextIndex;
        continue;
      }

      result[key] = {};
      index += 1;
      continue;
    }

    result[key] = parseScalar(rest);
    index += 1;
  }

  return { value: result, nextIndex: index };
}

function parseYaml(source) {
  return parseYamlBlock(source.split("\n"), 0, 0).value;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  return { frontmatter: parseYaml(match[1]), body: match[2].trim() };
}

function loadCanonicalTopics() {
  const topicsDir = path.join(repoRoot, "topics");
  const topicsById = new Map();
  for (const fileName of fs.readdirSync(topicsDir)) {
    if (!fileName.endsWith(".md")) continue;
    const { frontmatter, body } = parseFrontmatter(readText(path.join(topicsDir, fileName)));
    if (topicsById.has(frontmatter.topic_id)) {
      throw new Error(`Duplicate topic_id '${frontmatter.topic_id}' in main`);
    }
    topicsById.set(frontmatter.topic_id, {
      topicId: frontmatter.topic_id,
      slug: fileName.replace(/\.md$/, ""),
      frontmatter,
      body,
    });
  }
  return topicsById;
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
  }
  return 0;
}

function releaseMatchesRange(release, range) {
  if (range.endsWith("+")) return compareVersions(release, range.slice(0, -1)) >= 0;
  if (range.includes("-")) {
    const [start, end] = range.split("-");
    return compareVersions(release, start) >= 0 && compareVersions(release, end) <= 0;
  }
  return release === range;
}

function renderVersionBlocks(markdown, release) {
  return markdown
    .replace(/:::version range="([^"]+)"\n([\s\S]*?)\n:::/g, (_match, range, content) => {
      return releaseMatchesRange(release, range) ? content.trim() : "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function loadReleaseAssetYaml(relativePath) {
  return parseYaml(gitShow(`${releaseBranch}:${relativePath}`));
}

function gitListTree(branch) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", branch], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function warn(message) {
  console.warn(`WARNING: ${message}`);
}

function warnReleaseBranchHygiene() {
  const forbiddenPrefixes = ["topics/", "snippets/", "scripts/", "docs/"];
  const paths = gitListTree(releaseBranch);
  const matches = paths.filter((filePath) => forbiddenPrefixes.some((prefix) => filePath.startsWith(prefix)));
  if (matches.length > 0) {
    warn(`Release branch '${releaseBranch}' contains paths that look like canonical content: ${matches.join(", ")}`);
  }
}

function validateRelease(topicsById, manifest, toc) {
  const warnings = [];
  const manifestTopicIds = manifest.topics || [];
  const tocTopicIds = new Set();

  for (const topicId of manifestTopicIds) {
    if (!topicsById.has(topicId)) {
      warnings.push(`Manifest topic_id '${topicId}' does not exist on main`);
    }
  }

  for (const section of toc.sections || []) {
    for (const topicId of section.topics || []) {
      tocTopicIds.add(topicId);
      if (!topicsById.has(topicId)) {
        warnings.push(`TOC topic_id '${topicId}' does not exist on main`);
      }
      if (!manifestTopicIds.includes(topicId)) {
        warnings.push(`TOC topic_id '${topicId}' is missing from manifests/book.yml`);
      }
    }
  }

  for (const topicId of manifestTopicIds) {
    if (!tocTopicIds.has(topicId)) {
      warnings.push(`Manifest topic_id '${topicId}' is missing from assets/toc.yml`);
    }
  }

  for (const message of warnings) {
    warn(message);
  }
}

function main() {
  ensureDir(distRoot);
  const topicsById = loadCanonicalTopics();
  const manifest = loadReleaseAssetYaml("manifests/book.yml");
  const toc = loadReleaseAssetYaml("assets/toc.yml");
  const releaseMetadata = loadReleaseAssetYaml("assets/release-metadata.yml");
  const release = releaseMetadata.release;

  warnReleaseBranchHygiene();
  validateRelease(topicsById, manifest, toc);

  const outputDir = path.join(distRoot, release);
  const siteReleaseDir = path.join(siteRoot, release);
  ensureDir(outputDir);
  ensureDir(siteReleaseDir);

  const includedTopics = [];
  const skippedTopics = [];

  for (const topicId of manifest.topics || []) {
    const topic = topicsById.get(topicId);
    if (!topic) {
      warn(`Skipping missing topic_id '${topicId}'`);
      continue;
    }
    if ((topic.frontmatter.lifecycle?.applies_to || []).includes(release)) {
      includedTopics.push(topic);
      const renderedMarkdown = renderVersionBlocks(topic.body, release);
      fs.writeFileSync(path.join(outputDir, `${topic.slug}.md`), renderedMarkdown);
      fs.writeFileSync(
        path.join(siteReleaseDir, `${topic.slug}.html`),
        markdownToHtml(renderedMarkdown, topic.frontmatter.title || topic.slug, release, releaseBranch)
      );
    } else {
      skippedTopics.push({
        slug: topic.slug,
        reason: `Filtered out by lifecycle.applies_to for release ${release}`,
      });
    }
  }

  const tocSummary = (toc.sections || [])
    .map((section) => {
      const visible = (section.topics || [])
        .filter((topicId) => includedTopics.some((topic) => topic.topicId === topicId))
        .map((topicId) => topicsById.get(topicId)?.slug)
        .filter(Boolean);
      if (visible.length === 0) return null;
      return `- ${section.title}: ${visible.join(", ")}`;
    })
    .filter(Boolean)
    .join("\n");

  const index = [
    `# ${releaseMetadata.display_name}`,
    "",
    `Publish path: \`${releaseMetadata.publish_path}\``,
    `Status: \`${releaseMetadata.status}\``,
    `Latest: \`${releaseMetadata.is_latest}\``,
    "",
    "## Included topics",
    ...includedTopics.map((topic) => `- ${topic.slug} (${topic.topicId})`),
    "",
    "## Filtered topics",
    ...(skippedTopics.length ? skippedTopics.map((topic) => `- ${topic.slug}: ${topic.reason}`) : ["- none"]),
    "",
    "## TOC summary",
    tocSummary || "- no visible sections",
    "",
    "## Source mapping",
    `- Canonical branch: \`main\``,
    `- Release branch: \`${releaseBranch}\``,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(outputDir, "index.md"), index);
  fs.writeFileSync(path.join(siteReleaseDir, "index.html"), releaseIndexToHtml(index, release, releaseBranch));
  fs.writeFileSync(path.join(siteRoot, ".nojekyll"), "");
  console.log(`Built release ${release} from main + ${releaseBranch}`);
}

main();
