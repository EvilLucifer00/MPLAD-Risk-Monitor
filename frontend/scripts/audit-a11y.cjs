/**
 * Automated Accessibility (a11y) Verification Script
 * Uses axe-core inside JSDOM to audit DOM structures and components against WCAG 2.1 AA rules.
 */
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

async function runA11yAudit() {
  console.log('🔍 Running automated WCAG 2.1 AA accessibility audit...\n');

  const testCases = [
    {
      name: 'Portal Navigation & Shell Layout',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Portal Shell</title></head>
        <body>
          <header role="banner">
            <nav aria-label="Main Navigation">
              <a href="/mp" aria-current="page">Dashboard</a>
              <a href="/mp/projects">My Projects</a>
            </nav>
          </header>
          <main id="main-content" role="main">
            <h1>MPLADS Risk Monitor</h1>
            <p>Welcome to the transparent governance portal.</p>
          </main>
        </body>
        </html>
      `
    },
    {
      name: 'Accessible Dialog / Modal Window',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Modal Window</title></head>
        <body>
          <main>
            <h1>Projects</h1>
            <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
              <h2 id="dialog-title">Sanction Project Proposal</h2>
              <p id="dialog-desc">Assign an implementing agency to sanction this work.</p>
              <form>
                <label for="agency-select">Implementing Agency</label>
                <select id="agency-select" name="agency">
                  <option value="PWD">Public Works Department</option>
                </select>
                <button type="submit">Confirm Sanction</button>
                <button type="button">Cancel</button>
              </form>
            </div>
          </main>
        </body>
        </html>
      `
    },
    {
      name: 'Review Status and Risk Badges',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Badges</title></head>
        <body>
          <main>
            <h1>Project Table</h1>
            <table>
              <caption>List of constituency projects and audit status</caption>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Status</th>
                  <th scope="col">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Solar High-Mast Lighting</td>
                  <td><span class="badge" aria-label="Status: Sanctioned">Sanctioned</span></td>
                  <td><span class="badge" aria-label="Risk Level: Low">Low</span></td>
                </tr>
              </tbody>
            </table>
          </main>
        </body>
        </html>
      `
    }
  ];

  let totalViolations = 0;

  for (const tc of testCases) {
    const dom = new JSDOM(tc.html, { runScripts: 'dangerously' });
    const { document } = dom.window;

    const results = await axe.run(document.documentElement, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });

    if (results.violations.length === 0) {
      console.log(`  ✅ [PASS] ${tc.name} (0 violations)`);
    } else {
      console.error(`  ❌ [FAIL] ${tc.name} (${results.violations.length} violations):`);
      results.violations.forEach((v) => {
        console.error(`     - [${v.impact.toUpperCase()}] ${v.help}: ${v.description}`);
        v.nodes.forEach((n) => console.error(`       Target: ${n.target.join(', ')}`));
      });
      totalViolations += results.violations.length;
    }
  }

  console.log('\n───────────────────────────────────────────────────');
  if (totalViolations === 0) {
    console.log('🎉 Accessibility Audit Complete: All checks passed with 0 violations!');
    process.exit(0);
  } else {
    console.error(`⚠️ Audit failed with ${totalViolations} accessibility violations.`);
    process.exit(1);
  }
}

runA11yAudit().catch((err) => {
  console.error('Fatal error during a11y audit:', err);
  process.exit(1);
});

