const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const distRoot = path.join(repoRoot, "dist");
const siteRoot = path.join(repoRoot, "site");

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listReleaseBranches() {
  const output = execFileSync("git", ["for-each-ref", "--format=%(refname:short)", "refs/heads/release"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("release/") && line.endsWith("-assets"));
}

function buildRelease(branch) {
  execFileSync("node", [path.join("scripts", "build-from-branch.js"), branch], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function parseReleaseIndex(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const releaseMatch = source.match(/^# (.+)$/m);
  const publishPathMatch = source.match(/^Publish path: `([^`]+)`$/m);
  const statusMatch = source.match(/^Status: `([^`]+)`$/m);
  const latestMatch = source.match(/^Latest: `([^`]+)`$/m);
  const releaseLabel = releaseMatch ? releaseMatch[1] : path.basename(path.dirname(filePath));
  return {
    releaseLabel,
    publishPath: publishPathMatch ? publishPathMatch[1] : "",
    status: statusMatch ? statusMatch[1] : "",
    latest: latestMatch ? latestMatch[1] === "true" : false,
    releaseDir: path.basename(path.dirname(filePath)),
  };
}

function renderRootIndex(releases) {
  const cards = releases
    .map((release) => {
      const latestBadge = release.latest ? '<span class="badge">Latest</span>' : "";
      return `
        <article class="card">
          <h2><a href="./${release.releaseDir}/index.html">${release.releaseLabel}</a> ${latestBadge}</h2>
          <p><strong>Publish path:</strong> <code>${release.publishPath}</code></p>
          <p><strong>Status:</strong> ${release.status}</p>
        </article>
      `;
    })
    .join("\n");

  const generatedAt = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>content-reuse-strategy</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fb;
      --card: #ffffff;
      --text: #172033;
      --muted: #52607a;
      --accent: #0b5fff;
      --border: #d6dfef;
      --nav: #0d1b3a;
    }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 40%);
      color: var(--text);
    }
    header {
      background: var(--nav);
      color: white;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .topbar {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .topbar-nav {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .topbar-nav a {
      color: #dfe8ff;
      text-decoration: none;
      font-size: 0.95rem;
    }
    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 48px 20px 64px;
    }
    h1 { margin-top: 0; font-size: 2.4rem; }
    p.lead { color: var(--muted); max-width: 720px; }
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      margin-top: 28px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 10px 30px rgba(20, 44, 88, 0.06);
    }
    .card h2 {
      margin-top: 0;
      font-size: 1.2rem;
    }
    .card a { color: var(--accent); text-decoration: none; }
    .badge {
      display: inline-block;
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #d9e7ff;
      color: #1141a8;
      font-size: 0.75rem;
      vertical-align: middle;
    }
    code {
      background: #eef3fb;
      border-radius: 6px;
      padding: 2px 6px;
    }
    footer {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 20px 32px;
      color: var(--muted);
      font-size: 0.92rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div class="brand">content-reuse-strategy</div>
      <nav class="topbar-nav">
        ${releases.map((release) => `<a href="./${release.releaseDir}/index.html">${release.releaseLabel}</a>`).join("")}
      </nav>
    </div>
  </header>
  <main>
    <h1>content-reuse-strategy</h1>
    <p class="lead">Single-repo Option 2 proof of concept. Canonical topics live on <code>main</code>; release packaging lives on <code>release/*-assets</code> branches; GitHub Actions assembles and publishes the site.</p>
    <section class="grid">
      ${cards}
    </section>
  </main>
  <footer>
    Built from <code>main</code> and release asset branches. Generated at <code>${generatedAt}</code>.
  </footer>
</body>
</html>`;
}

function main() {
  removeDir(distRoot);
  removeDir(siteRoot);
  ensureDir(distRoot);
  ensureDir(siteRoot);

  const branches = listReleaseBranches();
  for (const branch of branches) {
    buildRelease(branch);
  }

  const releaseIndexes = fs.readdirSync(distRoot)
    .map((releaseDir) => path.join(distRoot, releaseDir, "index.md"))
    .filter((filePath) => fs.existsSync(filePath))
    .map(parseReleaseIndex)
    .sort((left, right) => left.releaseDir.localeCompare(right.releaseDir, undefined, { numeric: true }));

  fs.writeFileSync(path.join(siteRoot, "index.html"), renderRootIndex(releaseIndexes));
  fs.writeFileSync(path.join(siteRoot, ".nojekyll"), "");
  console.log(`Built site in ${siteRoot}`);
}

main();
