// Builds docs/ from apps.json and icons/. Each app gets its own folder, so Chrome installs each one as a separate app with its own icon.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT = path.join(__dirname, "docs");
const SIZES = [192, 512];
const apps = JSON.parse(fs.readFileSync(path.join(__dirname, "apps.json"), "utf8"));

const STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-content: center; gap: 20px; padding: 24px 16px;
    background: var(--bg); color: #f0f4f1; font: 400 17px/1.45 Roboto, "Segoe UI", sans-serif; text-align: center; }
  img { width: 128px; height: 128px; border-radius: 28%; margin: 0 auto; display: block; }
  h1 { margin: 0; font-size: 26px; }
  ol { margin: 0 auto; padding-left: 22px; max-width: 320px; text-align: left; }
  a { color: inherit; font-weight: 600; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 20px; }
  .launching body > * { display: none; }
`;

const launcherPage = app => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${app.name}</title>
<meta name="theme-color" content="${app.color}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<style>:root { --bg: ${app.color}; }${STYLE}</style>
<script>
  // Only the installed icon opens with ?launch. In a normal tab the page has to stay put so Chrome can offer to install it.
  if (new URLSearchParams(location.search).has("launch")) {
    document.documentElement.classList.add("launching");
    location.replace(${JSON.stringify(app.url)});
  }
</script>
</head>
<body>
  <img src="icon-512.png" alt="">
  <h1>${app.name}</h1>
  <ol>
    <li>Tap Chrome's <b>⋮</b> menu.</li>
    <li>Tap <b>Add to Home screen</b>, then <b>Install</b>.</li>
    <li>Remove your old ${app.name} shortcut.</li>
  </ol>
  <a href="${app.url}">Open ${app.name}</a>
</body>
</html>
`;

const manifest = app => JSON.stringify({
  name: app.name,
  short_name: app.name,
  // Bumping an app's "install" number in apps.json lets Chrome install it again after it has lost track of an old copy.
  start_url: app.install ? `./?launch&install=${app.install}` : "./?launch",
  scope: "./",
  display: "standalone",
  background_color: app.color,
  theme_color: app.color,
  icons: SIZES.flatMap(size => ["any", "maskable"].map(purpose => ({
    src: `icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose
  })))
}, null, 2) + "\n";

const indexPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>App Icons</title>
<style>:root { --bg: #0c1417; }${STYLE}</style>
</head>
<body>
  <ul>
${apps.map(app => `    <li><a href="${app.slug}/"><img src="${app.slug}/icon-192.png" alt=""><br>${app.name}</a></li>`).join("\n")}
  </ul>
</body>
</html>
`;

function iconSource(slug) {
  const file = [".svg", ".png"].map(ext => path.join(__dirname, "icons", slug + ext)).find(fs.existsSync);
  if (!file) throw new Error(`No icon for ${slug}: add icons/${slug}.svg or icons/${slug}.png`);
  return file;
}

async function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const app of apps) {
    const dir = path.join(OUT, app.slug);
    fs.mkdirSync(dir, { recursive: true });
    const source = iconSource(app.slug);
    for (const size of SIZES) {
      await sharp(source, { density: 300 }).resize(size, size, { fit: "cover" }).flatten({ background: app.color }).png()
        .toFile(path.join(dir, `icon-${size}.png`));
    }
    fs.writeFileSync(path.join(dir, "manifest.webmanifest"), manifest(app));
    fs.writeFileSync(path.join(dir, "index.html"), launcherPage(app));
  }
  fs.writeFileSync(path.join(OUT, "index.html"), indexPage());
  console.log(`Built ${apps.length} apps in docs/`);
}

build().catch(err => { console.error(err.message); process.exit(1); });
