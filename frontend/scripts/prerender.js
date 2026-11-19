import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('prerender.js: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

const pages = [
  {
    route: '/',
    outputPath: path.join(distDir, 'index.html'),
    title: 'MPLADS Risk Monitor | Fund Utilisation & Project Risk Analytics',
    description: 'Independent Smart India Hackathon 2026 prototype for monitoring MPLADS fund utilisation, project completion rates, and heuristic risk scoring across 543 parliamentary constituencies.',
    canonical: 'https://mplad-risk-monitor.vercel.app/',
    content: `
      <header class="bg-[#0b2545] text-white px-4 py-3 border-b border-white/10">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/" class="flex items-center gap-3">
              <img src="/images/emblem.png" alt="Emblem of India" width="36" height="44" class="w-9 h-11 object-contain shrink-0" />
              <div>
                <span class="font-bold text-lg text-white leading-tight block">MPLADS Risk Monitor</span>
                <span class="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold">SIH 2026 Prototype</span>
              </div>
            </a>
            <nav aria-label="Main Navigation">
              <ul class="flex gap-4 text-xs font-semibold">
                <li><a href="/about" class="text-slate-300 hover:text-white">About</a></li>
                <li><a href="/data-sources" class="text-slate-300 hover:text-white">Data Sources</a></li>
                <li><a href="/methodology" class="text-slate-300 hover:text-white">Methodology</a></li>
              </ul>
            </nav>
          </div>
          <div>
            <a href="/login" class="px-3.5 py-1.5 bg-[#123b63] border border-white/20 text-white rounded text-xs font-semibold hover:bg-white/10">Portal Login</a>
          </div>
        </div>
      </header>
      <main id="main-content" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold text-[#123b63]">MPLADS Risk Monitor & Analytics</h1>
        <p class="mt-2 text-slate-600">Public data-driven fund surveillance, geospatial risk mapping, and heuristic anomaly flags across 543 Parliamentary Constituencies in India.</p>
        <section class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <strong>Independent Smart India Hackathon Prototype:</strong> This platform is an independent innovation prototype developed for SIH 2026 and is not affiliated with, operated by, or endorsed by the Government of India or MoSPI.
        </section>
      </main>
    `,
  },
  {
    route: '/about',
    outputPath: path.join(distDir, 'about/index.html'),
    title: 'About the Project | MPLADS Risk Monitor (SIH Prototype)',
    description: 'Learn about MPLADS Risk Monitor: an independent Smart India Hackathon 2026 prototype demonstrating data-driven fund utilization monitoring, heuristic risk scoring, and public transparency.',
    canonical: 'https://mplad-risk-monitor.vercel.app/about',
    content: `
      <header class="bg-[#0b2545] text-white px-4 py-3 border-b border-white/10">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/" class="flex items-center gap-3">
              <img src="/images/emblem.png" alt="Emblem of India" width="36" height="44" class="w-9 h-11 object-contain shrink-0" />
              <div>
                <span class="font-bold text-lg text-white leading-tight block">MPLADS Risk Monitor</span>
                <span class="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold">SIH 2026 Prototype</span>
              </div>
            </a>
            <nav aria-label="Main Navigation">
              <ul class="flex gap-4 text-xs font-semibold">
                <li><a href="/about" class="text-slate-300 hover:text-white">About</a></li>
                <li><a href="/data-sources" class="text-slate-300 hover:text-white">Data Sources</a></li>
                <li><a href="/methodology" class="text-slate-300 hover:text-white">Methodology</a></li>
              </ul>
            </nav>
          </div>
          <div>
            <a href="/login" class="px-3.5 py-1.5 bg-[#123b63] border border-white/20 text-white rounded text-xs font-semibold hover:bg-white/10">Portal Login</a>
          </div>
        </div>
      </header>
      <main id="main-content" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold text-[#123b63]">About MPLADS Risk Monitor</h1>
        <p class="mt-2 text-slate-600">An independent research and engineering prototype engineered to demonstrate how public datasets, automated anomaly heuristics, and geospatial intelligence can strengthen parliamentary fund monitoring in India.</p>
        <section class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <strong>Independent Prototype Notice:</strong> Developed exclusively for the Smart India Hackathon (SIH) 2026 evaluation. Not affiliated with, operated by, or endorsed by the Government of India or MoSPI.
        </section>
        <section class="mt-8">
          <h2 class="text-xl font-bold text-[#123b63]">Problem Statement & Context</h2>
          <p class="mt-2 text-sm text-slate-700 leading-relaxed">Under the Member of Parliament Local Area Development Scheme (MPLADS), each MP is entitled to recommend developmental works to the tune of ₹5 Crore per annum to their respective District Authorities. Tracking across 543 Lok Sabha constituencies frequently faces sanction delays, unspent balances, and execution backlogs.</p>
        </section>
      </main>
    `,
  },
  {
    route: '/data-sources',
    outputPath: path.join(distDir, 'data-sources/index.html'),
    title: 'Data Sources & Integrity | MPLADS Risk Monitor',
    description: 'Understand data provenance, derived metrics, and demonstration datasets utilized by the MPLADS Risk Monitor SIH prototype.',
    canonical: 'https://mplad-risk-monitor.vercel.app/data-sources',
    content: `
      <header class="bg-[#0b2545] text-white px-4 py-3 border-b border-white/10">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/" class="flex items-center gap-3">
              <img src="/images/emblem.png" alt="Emblem of India" width="36" height="44" class="w-9 h-11 object-contain shrink-0" />
              <div>
                <span class="font-bold text-lg text-white leading-tight block">MPLADS Risk Monitor</span>
                <span class="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold">SIH 2026 Prototype</span>
              </div>
            </a>
            <nav aria-label="Main Navigation">
              <ul class="flex gap-4 text-xs font-semibold">
                <li><a href="/about" class="text-slate-300 hover:text-white">About</a></li>
                <li><a href="/data-sources" class="text-slate-300 hover:text-white">Data Sources</a></li>
                <li><a href="/methodology" class="text-slate-300 hover:text-white">Methodology</a></li>
              </ul>
            </nav>
          </div>
          <div>
            <a href="/login" class="px-3.5 py-1.5 bg-[#123b63] border border-white/20 text-white rounded text-xs font-semibold hover:bg-white/10">Portal Login</a>
          </div>
        </div>
      </header>
      <main id="main-content" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold text-[#123b63]">Data Sources, Derived Metrics & Synthesis Disclosures</h1>
        <p class="mt-2 text-slate-600">Transparent disclosure of data origins, computational formulas, demonstration datasets, and analytical boundaries.</p>
        <section class="mt-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs">
          <strong>Demonstration & Synthetic Data Disclosure:</strong> Utilizes demonstration baseline snapshots and synthetic project scenarios to evaluate 543 constituencies. Not to be cited as official audit findings against specific representatives.
        </section>
        <section class="mt-8">
          <h2 class="text-xl font-bold text-[#123b63]">1. Official Public Reference Sources</h2>
          <p class="mt-2 text-sm text-slate-700">MoSPI MPLADS Portal (mplads.gov.in), Open Government Data Platform India (data.gov.in), and Survey of India parliamentary boundaries GIS.</p>
        </section>
      </main>
    `,
  },
  {
    route: '/methodology',
    outputPath: path.join(distDir, 'methodology/index.html'),
    title: 'Risk Scoring Methodology & Analytics | MPLADS Risk Monitor',
    description: 'Understand the 8-step anomaly detection pipeline, composite scoring weights, and heuristic risk algorithms powering the MPLADS Risk Monitor.',
    canonical: 'https://mplad-risk-monitor.vercel.app/methodology',
    content: `
      <header class="bg-[#0b2545] text-white px-4 py-3 border-b border-white/10">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/" class="flex items-center gap-3">
              <img src="/images/emblem.png" alt="Emblem of India" width="36" height="44" class="w-9 h-11 object-contain shrink-0" />
              <div>
                <span class="font-bold text-lg text-white leading-tight block">MPLADS Risk Monitor</span>
                <span class="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold">SIH 2026 Prototype</span>
              </div>
            </a>
            <nav aria-label="Main Navigation">
              <ul class="flex gap-4 text-xs font-semibold">
                <li><a href="/about" class="text-slate-300 hover:text-white">About</a></li>
                <li><a href="/data-sources" class="text-slate-300 hover:text-white">Data Sources</a></li>
                <li><a href="/methodology" class="text-slate-300 hover:text-white">Methodology</a></li>
              </ul>
            </nav>
          </div>
          <div>
            <a href="/login" class="px-3.5 py-1.5 bg-[#123b63] border border-white/20 text-white rounded text-xs font-semibold hover:bg-white/10">Portal Login</a>
          </div>
        </div>
      </header>
      <main id="main-content" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold text-[#123b63]">Risk Scoring Methodology & Anomaly Heuristics</h1>
        <p class="mt-2 text-slate-600">Full technical breakdown of the 8-step analytical pipeline, statistical indicator formulas, and composite risk scoring weights.</p>
        <section class="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs">
          <strong>Prioritization Signals Notice:</strong> Risk scores are heuristic indicators to assist administrators in spotting bottlenecks. They do not constitute proof or allegations of financial wrongdoing.
        </section>
        <section class="mt-8">
          <h2 class="text-xl font-bold text-[#123b63]">Composite Risk Formula</h2>
          <p class="mt-2 text-xs font-mono bg-slate-100 p-3 rounded">Risk Score = (0.35 × Utilisation_Lag) + (0.25 × Sanction_Delay) + (0.20 × Cost_Variance) + (0.20 × Execution_Lag)</p>
        </section>
      </main>
    `,
  },
];

for (const page of pages) {
  let html = template;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/?>/,
    `<meta name="description" content="${page.description}" />`
  );

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  // Replace Open Graph metadata
  html = html.replace(
    /<meta property="og:title" content=".*?"\s*\/?>/,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"\s*\/?>/,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?"\s*\/?>/,
    `<meta property="og:url" content="${page.canonical}" />`
  );

  // Inject Static Pre-rendered HTML inside <div id="root">
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${page.content}</div>`
  );

  // Ensure output directory exists
  const outDir = path.dirname(page.outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(page.outputPath, html, 'utf8');
  console.log(`Prerendered ${page.route} -> ${page.outputPath}`);
}

console.log('Prerendering completed successfully.');
