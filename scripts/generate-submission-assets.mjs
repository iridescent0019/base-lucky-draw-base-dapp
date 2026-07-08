import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content, bg = "#fff6df") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#ffd57a"/>
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1010 280) rotate(45) scale(700 700)">
        <stop offset="0%" stop-color="#fff5c0" stop-opacity=".95"/>
        <stop offset="100%" stop-color="#fff5c0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 33);
  return `
    <text x="72" y="110" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#b55412">BASE LUCKY DRAW</text>
    <text x="72" y="232" font-family="Arial, sans-serif" font-size="92" font-weight="900" fill="#3b2412">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${308 + index * 44}" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#7c5b32">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, fg = "#3b2412") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="#3b2412" stroke-width="3"/>
    <text x="${x + 30}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function panel(x, y, width, height, title, lines, dark = false) {
  const bg = dark ? "#3b2412" : "#fffdf5";
  const fg = dark ? "#ffffff" : "#3b2412";
  const sub = dark ? "#ffe6ad" : "#7c5b32";
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="32" fill="${bg}" stroke="#3b2412" stroke-width="4"/>
      <text x="${x + 28}" y="${y + 54}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${sub}">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 28}" y="${y + 118 + index * 40}" font-family="Arial, sans-serif" font-size="34" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? fg : sub}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function button(x, y, width, text, fill, fg = "#3b2412") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}" stroke="#3b2412" stroke-width="4"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Start a lucky draw.", "Create one paid entry pool on Base and set up a single winner reveal with a bright mobile-first flow.")}
    ${pill(72, 408, "Creator flow", "#ffbf4d")}
    ${pill(262, 408, "One winner", "#ffffff")}
    ${panel(72, 540, 1140, 286, "Create draw", ["Base Launch Box", "Entry fee: 0.001 ETH", "Duration: 12h"])}
    ${panel(72, 872, 548, 246, "Draw note", ["One wallet joins once", "Winner takes the full pool"])}
    ${panel(664, 872, 548, 246, "Rules", ["Entries stay visible onchain", "Winner is revealed after timer ends"])}
    ${panel(72, 1166, 1140, 290, "Preview board", ["Entrants: 0", "Prize pool: 0.0000 ETH", "Winner: not drawn yet"], true)}
    ${panel(72, 1508, 1140, 250, "Why it works", ["Clear community mechanic", "Simple one-tap entry", "Easy result reveal"], false)}
    ${button(72, 2522, 1140, "Create on Base", "#ffbf4d")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("Entries are live.", "Users can see the fee, total entrants, pool size, and join the draw without losing context.")}
    ${pill(72, 408, "0x9936...9652 connected", "#ffbf4d")}
    ${pill(412, 408, "Draw ID 12", "#ffffff")}
    ${panel(72, 536, 360, 246, "Entry fee", ["0.0010 ETH", "Fixed fee per wallet"])}
    ${panel(462, 536, 360, 246, "Entrants", ["24", "Each wallet can join once"])}
    ${panel(852, 536, 360, 246, "Prize pool", ["0.0240 ETH", "Grows with every entry"])}
    ${panel(72, 840, 1140, 310, "Draw machine", ["Base Launch Box", "Small community draw with one wallet, one entry, and one onchain winner.", "Time left: 8h 14m"], true)}
    ${panel(72, 1208, 1140, 286, "Entry panel", ["Join draw", "Entry confirmed after wallet approval", "Winner will be revealed onchain"], false)}
    ${panel(72, 1544, 1140, 254, "Status", ["Wallet joined the draw on Base.", "Entrant count and prize pool updated live."], true)}
    ${button(72, 2522, 1140, "Join draw", "#3b2412", "#ffffff")}
  `;
  return frame(content, "#fff0c2");
}

function screenshot3() {
  const content = `
    ${header("Reveal the winner.", "When the timer ends, the draw settles and the full pool goes to one winning wallet.")}
    ${pill(72, 408, "Ended", "#ffffff")}
    ${pill(208, 408, "Winner reveal", "#ffbf4d")}
    ${panel(72, 540, 548, 276, "Winner", ["0x8ab2...77f1", "Receives 0.0240 ETH", "Draw ID: 12"], true)}
    ${panel(664, 540, 548, 276, "Draw stats", ["24 entrants", "0.0010 ETH per entry", "One wallet won"], false)}
    ${panel(72, 874, 1140, 306, "Settlement receipt", ["Winner revealed on Base.", "Prize pool transferred to the winning wallet.", "Result stays publicly visible."], false)}
    ${panel(72, 1238, 1140, 290, "Final board", ["Title: Base Launch Box", "Entry fee: 0.001 ETH", "Prize pool: 0.0240 ETH"], true)}
    ${panel(72, 1582, 1140, 254, "Post-draw state", ["Draw complete", "Winner locked", "Community can verify the result"], false)}
    ${button(72, 2522, 1140, "Reveal winner", "#ffbf4d")}
  `;
  return frame(content, "#ffe6a6");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#fff6df"/>
    <rect x="138" y="138" width="748" height="748" rx="120" fill="#fffdf5" stroke="#3b2412" stroke-width="22"/>
    <circle cx="512" cy="388" r="182" fill="#ffbf4d" stroke="#3b2412" stroke-width="20"/>
    <circle cx="512" cy="388" r="104" fill="#fff2c1" stroke="#3b2412" stroke-width="14"/>
    <circle cx="438" cy="360" r="28" fill="#3b2412"/>
    <circle cx="512" cy="420" r="28" fill="#3b2412"/>
    <circle cx="586" cy="348" r="28" fill="#3b2412"/>
    <rect x="286" y="632" width="452" height="126" rx="34" fill="#3b2412"/>
    <text x="512" y="712" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#fffdf5">DRAW</text>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff6df"/>
        <stop offset="100%" stop-color="#ffd57a"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#3b2412">Base Lucky Draw</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#7c5b32">Create one-winner draws, collect entries, and reveal the result on Base.</text>
    ${pill(100, 348, "Bright raffle flow", "#ffbf4d")}
    ${pill(352, 348, "One winner", "#ffffff")}
    ${button(100, 448, 430, "Create draw", "#ffbf4d")}
    ${button(560, 448, 430, "Join draw", "#3b2412", "#ffffff")}
    ${panel(1186, 124, 624, 250, "Live draw", ["Entry fee: 0.0010 ETH", "Entrants: 24", "Prize pool: 0.0240 ETH"], true)}
    ${panel(1186, 420, 624, 250, "Winner reveal", ["Result settles onchain", "One wallet receives the full pool"], false)}
    ${panel(1186, 734, 624, 180, "Draw state", ["Colorful, simple, and obvious on mobile"], true)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);

for (const file of files) {
  console.log(file);
}
