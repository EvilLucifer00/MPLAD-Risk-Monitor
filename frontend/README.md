# 💻 MPLADS Risk Monitor — Frontend Application

> **Desktop-Grade, Offline-First Progressive Web Application for the Member of Parliament Local Area Development Scheme (MPLADS)**  
> *Built with React 19, Vite 8, Tailwind CSS 4, TanStack Query 5, and Zustand.*

---

## 🌟 Overview

The `frontend` package is a high-performance, accessible (WCAG 2.1 AA compliant) Single Page Application serving two core administrative workflows for public works governance:

1. **Member of Parliament (MP) Portal (`/mp/*`)**:
   - Real-time financial entitlement counters (₹5.00 Cr Entitlement, Amount Sanctioned, Amount Utilized, Unspent Balance).
   - Multi-step project proposal submission form (`/mp/submit`) with instant INR/Lakhs/Crores unit conversion, coordinate selection, and Cloudinary PDF attachment uploading.
   - High-performance virtualized portfolio directory (`/mp/projects`) using `@tanstack/react-virtual` supporting search, status filters, and risk badges.
   - Sector-wise expenditure breakdowns and monthly burn-rate analytics (`/mp/reports`) rendered with Recharts.
   - Centralized document repository (`/mp/documents`) for Administrative Sanctions, Work Orders, and Utilization Certificates.

2. **District Authority (DA) Portal (`/da/*`)**:
   - District Magistrate command dashboard (`/da`) displaying monitored constituencies, pending reviews, and risk radar.
   - Priority review queue (`/da/review`) triaging proposals by composite ML risk score with itemized factor breakdown cards (Cost Anomaly, Delay Probability, Duplicate Work Risk, Vendor Collusion Risk).
   - Interactive GIS constituency risk heatmap (`RiskMap.jsx`) using Leaflet and GeoJSON boundary polygons.
   - Vendor Watchlist (`/da/vendors`) auditing contractor saturation, cartel rings, and blacklisted entities.
   - Implementing Agency Directory (`/da/agencies`) tracking operational bandwidth and backlogs across PWD, RDD, CPWD, etc.

3. **Floating AI Assistant Widget (`AiAssistantWidget.jsx`)**:
   - Embedded Self-RAG assistant delivering real-time answers grounded in official MoSPI statutory guidelines via Server-Sent Events (SSE).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19.2** | Concurrent rendering, declarative transitions, and sub-second UI responsiveness. |
| **Build Tool** | **Vite 8.2** | Rapid HMR dev server and optimized Rollup production bundling. |
| **Styling** | **Tailwind CSS 4.3** | Utility-first CSS using `@tailwindcss/vite` with zero CSS bloat and official GoI palettes. |
| **Routing** | **React Router DOM 7.18** | Persistent shell layouts (`MpLayout.jsx`, `DaLayout.jsx`) keeping headers and sidebars permanently mounted. |
| **Server State** | **TanStack Query 5.105** | Memory caching (`staleTime: 5m`), in-flight request deduplication, and background refetching on reconnect. |
| **Client State** | **Zustand 5.0** | Lightweight synchronous auth state, JWT persistence, and UI drawer controls. |
| **Virtualization**| **@tanstack/react-virtual** | Virtualized row rendering for large constituency project tables. |
| **GIS Mapping** | **Leaflet 1.9 & React-Leaflet 5.0** | Interactive constituency choropleth heatmaps and boundary polygons. |
| **Charts** | **Recharts 3.10** | Responsive financial burn-rate and sector allocation SVG charts. |
| **Static Linter** | **Oxlint 1.79** | High-speed Rust-based static code analysis. |
| **A11y Testing** | **@axe-core/puppeteer** | Headless Chrome audit verifying 0 WCAG 2.1 AA violations. |

---

## 📡 Offline-First & Resilient Networking Architecture

1. **Persistent Layout Navigation**:
   - Navigation between sibling views inside `/mp/*` or `/da/*` swaps only the child component inside `<Outlet />`. The header, navigation sidebar, and background artwork remain mounted, delivering sub-50ms transitions without white flashes or layout shifts.

2. **Smart Offline Link Navigation (`OfflineLink.jsx`)**:
   - During network outages (`navigator.onLine = false`), links leading to pages that have not yet been cached in memory or service worker are safely disabled with an informative tooltip, preventing unexpected 404 or white-screen errors.

3. **Silent Auto-Reload on Reconnection**:
   - When the user transitions from offline to online, the query client immediately invalidates active queries and refreshes data in the background silently—without jarring full-page reloads, intrusive spinners, or scroll jumps.

4. **In-Flight Request Deduplication**:
   - Sibling dashboard components querying identical endpoints coalesce into a single HTTP promise, protecting against API waterfalls during backend cold-starts.

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Official Aesthetics**: Follows Guidelines for Indian Government Websites (GIGW) with official emblem branding and tri-color accents.
- **Skip Links**: Accessible `Skip to main content` keyboard bypass links.
- **Color Contrast**: All text and risk status badges maintain a minimum 4.5:1 contrast ratio.
- **ARIA & Landmarks**: Semantic `<header>`, `<nav>`, `<main>`, and `<aside>` landmark roles with appropriate `aria-live` and `aria-expanded` attributes.
- **Zero A11y Violations**: Verified via automated axe-core accessibility test suites (`npm run lint:a11y`).

---

## 🚦 Available Scripts

In the `frontend` directory, you can run:

```bash
# Start Vite development server at http://localhost:5173
npm run dev

# Run Vitest unit & component test suites
npm test

# Build optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview

# Run Oxlint high-speed static code analysis
npm run lint

# Run automated WCAG 2.1 AA accessibility audit
npm run lint:a11y
```

---

## 🔗 Architecture & Backend Integration

For complete system architecture, ML anomaly detection engines (Isolation Forest, Meta Prophet, SBERT, and XGBoost with TreeSHAP), Self-RAG statutory reasoning, and database schema, please refer to the primary repository documentation:

👉 **[Root Architecture & Project README](../README.md)**
