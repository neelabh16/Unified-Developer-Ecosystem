// =============================================================================
// Database Seeder — Populates MongoDB Atlas with 10 items per category
// =============================================================================
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const User = require('../models/User');
const Project = require('../models/Project');
const Community = require('../models/Community');
const Discussion = require('../models/Discussion');
const Hackathon = require('../models/Hackathon');
const CodexEntry = require('../models/CodexEntry');

// 1. Exactly 10 Developers / Users
const DV_DEVS = [
  { handle: 'kmori', name: 'Kenji Mori', email: 'kmori@devverse.local', avatarSeed: 'kmori', points: 9840, bio: 'Systems engineer obsessed with latency. Building databases that refuse to fall over.', skills: ['Rust', 'Go', 'Distributed Systems'] },
  { handle: 'ari-devs', name: 'Ari Solano', email: 'ari@devverse.local', avatarSeed: 'arisolano', points: 7420, bio: 'Frontend architect. If it doesn\'t feel alive, it isn\'t shipping.', skills: ['React', 'TypeScript', 'Motion Design'] },
  { handle: 'sena.codes', name: 'Sena Park', email: 'sena@devverse.local', avatarSeed: 'senapark', points: 11230, bio: 'Full-stack builder shipping realtime tools for teams that hate meetings.', skills: ['Node.js', 'Vue', 'CRDT'] },
  { handle: 'lumen', name: 'Lumen Cross', email: 'lumen@devverse.local', avatarSeed: 'lumencross', points: 15600, bio: 'Graphics programmer. I make the browser do things it was never asked to do.', skills: ['WebGL', 'Three.js', 'Shaders'] },
  { handle: 'noa.ml', name: 'Noa Reyes', email: 'noa@devverse.local', avatarSeed: 'noareyes', points: 6510, bio: 'ML engineer turning research papers into tools people actually use.', skills: ['Python', 'PyTorch', 'FastAPI'] },
  { handle: 'priya.dev', name: 'Priya Nair', email: 'priya@devverse.local', avatarSeed: 'priyanair', points: 4310, bio: 'Building calm software for busy teams.', skills: ['Vue', 'Node.js', 'Design Systems'] },
  { handle: 'dax', name: 'Dax Whitfield', email: 'dax@devverse.local', avatarSeed: 'daxwhitfield', points: 3020, bio: 'Tooling nerd. I build the things that build the things.', skills: ['Rust', 'CLI', 'DX'] },
  { handle: 'devon.codes', name: 'Devon Blake', email: 'devon@devverse.local', avatarSeed: 'devonblake', points: 5230, bio: 'Web app builder. I like turning a messy spreadsheet workflow into something people actually enjoy opening.', skills: ['JavaScript', 'DOM', 'REST API'] },
  { handle: 'elena-v', name: 'Elena Vega', email: 'elena@devverse.local', avatarSeed: 'elenavega', points: 8750, bio: 'Cloud architect & Kubernetes wrangler. Automating infrastructure so engineers can sleep soundly.', skills: ['Kubernetes', 'Terraform', 'Go', 'AWS'] },
  { handle: 'marcus-k', name: 'Marcus Kim', email: 'marcus@devverse.local', avatarSeed: 'marcuskim', points: 10420, bio: 'Security researcher & cryptographer. Auditing smart contracts and zero-knowledge primitives.', skills: ['Cryptography', 'Rust', 'Security', 'Solidity'] },
];

// 2. Exactly 10 Featured Projects
const DV_PROJECTS = [
  { legacyId: 'p1', art: 'project-7.png', title: 'Nebula UI Kit', desc: 'A glassmorphic component library for ambitious dashboards.', tags: ['React', 'TypeScript', 'Framer Motion'], difficulty: 'Intermediate', likesCount: 842, viewsCount: 12400, category: 'Frontend', authorHandle: 'ari-devs', gradient: 0 },
  { legacyId: 'p2', art: 'project-3.png', title: 'PulseDB', desc: 'A lightweight time-series database written for edge devices.', tags: ['Rust', 'WASM'], difficulty: 'Advanced', likesCount: 1290, viewsCount: 30100, category: 'Systems', authorHandle: 'kmori', gradient: 1 },
  { legacyId: 'p3', art: 'project-9.png', title: 'Origami Auth', desc: 'Drop-in passwordless auth with WebAuthn and magic links.', tags: ['Node.js', 'Postgres'], difficulty: 'Intermediate', likesCount: 511, viewsCount: 8900, category: 'Backend', authorHandle: 'sena.codes', gradient: 2 },
  { legacyId: 'p4', art: 'project-1.png', title: 'Voxel Garden', desc: 'A procedurally generated voxel world renderer in the browser.', tags: ['Three.js', 'WebGL'], difficulty: 'Advanced', likesCount: 2043, viewsCount: 51200, category: 'Graphics', authorHandle: 'lumen', gradient: 3 },
  { legacyId: 'p5', art: 'project-8.png', title: 'Flowline', desc: 'A no-code workflow automation canvas for small teams.', tags: ['Vue', 'Node.js'], difficulty: 'Beginner', likesCount: 322, viewsCount: 6100, category: 'Frontend', authorHandle: 'priya.dev', gradient: 4 },
  { legacyId: 'p6', art: 'project-4.png', title: 'Shard', desc: 'A distributed key-value store built for chaos testing.', tags: ['Go', 'gRPC'], difficulty: 'Advanced', likesCount: 987, viewsCount: 21300, category: 'Systems', authorHandle: 'kmori', gradient: 0 },
  { legacyId: 'p7', art: 'project-6.png', title: 'Palette AI', desc: 'Generates accessible color systems from a single brand hex.', tags: ['Python', 'FastAPI'], difficulty: 'Intermediate', likesCount: 664, viewsCount: 14200, category: 'AI/ML', authorHandle: 'noa.ml', gradient: 1 },
  { legacyId: 'p8', art: 'project-13.png', title: 'Driftboard', desc: 'A realtime kanban board with offline-first sync.', tags: ['Svelte', 'CRDT'], difficulty: 'Intermediate', likesCount: 455, viewsCount: 9800, category: 'Frontend', authorHandle: 'ari-devs', gradient: 2 },
  { legacyId: 'p9', art: 'project-10.png', title: 'Kestrel CLI', desc: 'A blazing-fast scaffolding tool for monorepos.', tags: ['Rust', 'Clap'], difficulty: 'Beginner', likesCount: 210, viewsCount: 4300, category: 'Tools', authorHandle: 'dax', gradient: 3 },
  { legacyId: 'p10', art: 'project-2.png', title: 'Mural', desc: 'Collaborative infinite canvas for design critique.', tags: ['Canvas API', 'WebSockets'], difficulty: 'Advanced', likesCount: 1544, viewsCount: 38700, category: 'Frontend', authorHandle: 'sena.codes', gradient: 4 },
];

// 3. Exactly 10 Communities
const DV_COMMUNITIES = [
  { legacyId: 'c1', slug: 'rustaceans-guild', name: 'Rustaceans Guild', membersCount: 5, desc: 'Everything Rust — from borrow-checker fights to production war stories.', gradient: 0, onlineCount: 1 },
  { legacyId: 'c2', slug: 'frontend-atelier', name: 'Frontend Atelier', membersCount: 6, desc: 'A home for people who care about the pixel and the framework equally.', gradient: 2, onlineCount: 2 },
  { legacyId: 'c3', slug: 'distributed-systems-lab', name: 'Distributed Systems Lab', membersCount: 4, desc: 'CAP theorem debates, consensus algorithms, and postmortems.', gradient: 1, onlineCount: 1 },
  { legacyId: 'c4', slug: 'ml-practitioners', name: 'ML Practitioners', membersCount: 4, desc: 'From fine-tuning to inference — practical machine learning talk.', gradient: 3, onlineCount: 1 },
  { legacyId: 'c5', slug: 'indie-hackers-dev', name: 'Indie Hackers Dev', membersCount: 7, desc: 'Shipping solo projects and side quests into real products.', gradient: 4, onlineCount: 2 },
  { legacyId: 'c6', slug: 'webgl-shaders', name: 'WebGL & Shaders', membersCount: 3, desc: 'For people who think the GPU is the most fun part of the browser.', gradient: 0, onlineCount: 1 },
  { legacyId: 'c7', slug: 'cloud-native-ops', name: 'Cloud Native & DevOps', membersCount: 5, desc: 'Kubernetes architecture, CI/CD pipelines, and zero-downtime scaling.', gradient: 1, onlineCount: 1 },
  { legacyId: 'c8', slug: 'security-and-crypto', name: 'Security & Cryptography', membersCount: 4, desc: 'Penetration testing, threat modeling, zero-knowledge proofs, and secure code.', gradient: 2, onlineCount: 1 },
  { legacyId: 'c9', slug: 'mobile-craft', name: 'Mobile Craft', membersCount: 4, desc: 'High-performance iOS, Android, Flutter, and React Native engineering.', gradient: 3, onlineCount: 1 },
  { legacyId: 'c10', slug: 'apis-and-protocols', name: 'APIs & Protocols', membersCount: 5, desc: 'REST, GraphQL, gRPC, WebSockets, and designing durable developer interfaces.', gradient: 4, onlineCount: 1 },
];

// 4. Exactly 10 Hackathons
const DV_HACKATHONS = [
  {
    legacyId: 'h1',
    title: 'Aurora Hacks 2026',
    desc: 'A 48-hour sprint for tools that make developers faster.',
    longDesc: 'Aurora Hacks is DevVerse\'s flagship open-track event — 48 hours to build the developer tool you\'ve been meaning to make. Past winners have launched as real commercial products.',
    prize: '$25,000',
    participantsCount: 3200,
    difficulty: 'All levels',
    end: new Date(Date.now() + 1000 * 60 * 60 * 61),
    tags: ['Open Track'],
    organizer: 'DevVerse Labs',
    mode: 'Online · Global',
    gradient: 0,
    tracks: ['Developer Tools', 'Web Performance', 'Open Source'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'Fri, 9:00 AM UTC' },
      { label: 'Submissions close', when: 'Sun, 9:00 AM UTC' },
      { label: 'Winners announced', when: 'Sun, 6:00 PM UTC' },
    ],
    rules: ['Teams of up to 4 people', 'Code must be written during the event window', 'Any language or framework allowed', 'AI coding tools welcomed'],
    judging: [
      { criteria: 'Technical execution', weight: '35%' },
      { criteria: 'Originality', weight: '25%' },
      { criteria: 'Design & UX', weight: '20%' },
      { criteria: 'Presentation', weight: '20%' },
    ],
  },
  {
    legacyId: 'h2',
    title: 'Systems Underground',
    desc: 'Low-level, high-stakes. Build something the kernel would respect.',
    longDesc: 'A hackathon for people who think in memory addresses. Rewards raw performance and correctness over flashy UI.',
    prize: '$18,000',
    participantsCount: 940,
    difficulty: 'Advanced',
    end: new Date(Date.now() + 1000 * 60 * 60 * 190),
    tags: ['Systems'],
    organizer: 'Rustaceans Guild',
    mode: 'Online · Global',
    gradient: 1,
    tracks: ['Databases & Storage', 'Networking', 'Compilers & Runtimes'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'in 5 days' },
      { label: 'Submissions close', when: 'in 12 days' },
      { label: 'Winners announced', when: 'in 13 days' },
    ],
    rules: ['Solo or teams of up to 3', 'Reproducible benchmarks required', 'Open source dependencies only'],
    judging: [
      { criteria: 'Performance', weight: '40%' },
      { criteria: 'Correctness', weight: '30%' },
      { criteria: 'Code quality', weight: '20%' },
      { criteria: 'Write-up', weight: '10%' },
    ],
  },
  {
    legacyId: 'h3',
    title: 'AI for Builders',
    desc: 'Ship an AI-native dev tool in one weekend.',
    longDesc: 'Judged specifically on tools that make engineers faster or smarter at their craft. Bring a model or clever prompt pipeline.',
    prize: '$30,000',
    participantsCount: 5100,
    difficulty: 'Intermediate',
    end: new Date(Date.now() + 1000 * 60 * 60 * 340),
    tags: ['AI/ML'],
    organizer: 'ML Practitioners',
    mode: 'Online · Global',
    gradient: 2,
    tracks: ['Developer Productivity', 'Code Understanding', 'Agents & Automation'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'in 9 days' },
      { label: 'Submissions close', when: 'in 23 days' },
      { label: 'Winners announced', when: 'in 24 days' },
    ],
    rules: ['Teams up to 5', 'Disclose AI-assisted code segments', 'Must be usable by third parties'],
    judging: [
      { criteria: 'Utility to developers', weight: '35%' },
      { criteria: 'Technical execution', weight: '30%' },
      { criteria: 'Originality', weight: '20%' },
      { criteria: 'Presentation', weight: '15%' },
    ],
  },
  {
    legacyId: 'h4',
    title: 'Pixel & Motion',
    desc: 'A hackathon for interfaces that feel like magic.',
    longDesc: 'Built for designers and developers who obsess over micro-interactions, spring physics, and keyboard accessibility.',
    prize: '$12,000',
    participantsCount: 1670,
    difficulty: 'Beginner friendly',
    end: new Date(Date.now() + 1000 * 60 * 60 * 24),
    tags: ['Frontend'],
    organizer: 'Frontend Atelier',
    mode: 'Online · Global',
    gradient: 3,
    tracks: ['Micro-interactions', 'Accessibility', 'Design Systems'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'tomorrow' },
      { label: 'Submissions close', when: 'in 3 days' },
      { label: 'Winners announced', when: 'in 4 days' },
    ],
    rules: ['Solo or teams up to 4', 'Video walkthrough required', 'Accessible navigation enforced'],
    judging: [
      { criteria: 'Craft & polish', weight: '35%' },
      { criteria: 'Accessibility', weight: '25%' },
      { criteria: 'Originality', weight: '25%' },
      { criteria: 'Presentation', weight: '15%' },
    ],
  },
  {
    legacyId: 'h5',
    title: 'Edge Cloud Sprint',
    desc: 'Deploy ultra-fast computing at the border of the internet.',
    longDesc: 'Optimize distributed compute on edge workers (Cloudflare, Vercel, Fly.io). The lowest latency wins.',
    prize: '$20,000',
    participantsCount: 1250,
    difficulty: 'Intermediate',
    end: new Date(Date.now() + 1000 * 60 * 60 * 120),
    tags: ['Cloud', 'Edge'],
    organizer: 'Cloud Native & DevOps',
    mode: 'Online · Global',
    gradient: 4,
    tracks: ['Serverless WASM', 'Edge Databases', 'Global CDN Routing'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'in 3 days' },
      { label: 'Submissions close', when: 'in 8 days' },
    ],
    rules: ['Teams up to 4', 'Edge runtime required'],
    judging: [{ criteria: 'Global Latency', weight: '50%' }, { criteria: 'Architecture', weight: '50%' }],
  },
  {
    legacyId: 'h6',
    title: 'Zero-Knowledge Jam',
    desc: 'Privacy-first cryptography and verifiable compute.',
    longDesc: 'Construct verifiable computation circuits and privacy-preserving applications using zk-SNARKs and STARKs.',
    prize: '$35,000',
    participantsCount: 820,
    difficulty: 'Advanced',
    end: new Date(Date.now() + 1000 * 60 * 60 * 240),
    tags: ['Security', 'Crypto'],
    organizer: 'Security & Cryptography',
    mode: 'Online · Global',
    gradient: 0,
    tracks: ['ZK Proofs', 'Verifiable ML', 'Anonymous Identity'],
    timeline: [
      { label: 'Registration opens', when: 'Now' },
      { label: 'Hacking begins', when: 'in 6 days' },
    ],
    rules: ['Open source proofs', 'Mathematical correctness review'],
    judging: [{ criteria: 'Cryptographic rigor', weight: '50%' }, { criteria: 'Real-world utility', weight: '50%' }],
  },
  {
    legacyId: 'h7',
    title: 'Open Source Revival',
    desc: 'Adopt, refactor, and modernize forgotten open-source gems.',
    longDesc: 'Take abandoned or legacy open source tools and bring modern TypeScript, Rust, or documentation to them.',
    prize: '$15,000',
    participantsCount: 2100,
    difficulty: 'All levels',
    end: new Date(Date.now() + 1000 * 60 * 60 * 168),
    tags: ['Open Source'],
    organizer: 'DevVerse Labs',
    mode: 'Online · Global',
    gradient: 1,
    tracks: ['Maintainability', 'Modernization', 'Performance Upgrades'],
    timeline: [{ label: 'Registration open', when: 'Now' }],
    rules: ['Permissive OSS licenses only', 'Upstream pull requests required'],
    judging: [{ criteria: 'Community impact', weight: '40%' }, { criteria: 'Refactoring quality', weight: '60%' }],
  },
  {
    legacyId: 'h8',
    title: 'Mobile First Odyssey',
    desc: 'Buttery-smooth gestures and offline-first mobile apps.',
    longDesc: 'Build fluid mobile experiences using Flutter, React Native, Swift, or Kotlin that work seamlessly in airplane mode.',
    prize: '$22,000',
    participantsCount: 1400,
    difficulty: 'Intermediate',
    end: new Date(Date.now() + 1000 * 60 * 60 * 210),
    tags: ['Mobile'],
    organizer: 'Mobile Craft',
    mode: 'Online · Global',
    gradient: 2,
    tracks: ['Offline Synchronization', 'Gesture Physics', 'Cross-Platform'],
    timeline: [{ label: 'Registration open', when: 'Now' }],
    rules: ['Run on physical devices or emulators', 'Touch interaction focus'],
    judging: [{ criteria: 'UX smoothness', weight: '50%' }, { criteria: 'Offline resilience', weight: '50%' }],
  },
  {
    legacyId: 'h9',
    title: 'Browser Game Jam',
    desc: 'Craft lightweight games directly in WebGL and WebAudio.',
    longDesc: 'Create instant-play games that load under 5MB in the browser with no app store downloads.',
    prize: '$16,000',
    participantsCount: 1950,
    difficulty: 'Beginner friendly',
    end: new Date(Date.now() + 1000 * 60 * 60 * 96),
    tags: ['Graphics', 'GameDev'],
    organizer: 'WebGL & Shaders',
    mode: 'Online · Global',
    gradient: 3,
    tracks: ['2D Mechanics', '3D Environments', 'Procedural Audio'],
    timeline: [{ label: 'Registration open', when: 'Now' }],
    rules: ['Max 5MB bundle size', 'Runs in evergreen browsers'],
    judging: [{ criteria: 'Fun factor', weight: '50%' }, { criteria: 'Technical execution', weight: '50%' }],
  },
  {
    legacyId: 'h10',
    title: 'Cyber Defense Crucible',
    desc: 'Hardening modern web applications against automated attacks.',
    longDesc: 'Build proactive defense shields, bot mitigation proxies, and automated vulnerability detection engines.',
    prize: '$28,000',
    participantsCount: 1100,
    difficulty: 'Advanced',
    end: new Date(Date.now() + 1000 * 60 * 60 * 300),
    tags: ['Security', 'DevSecOps'],
    organizer: 'Security & Cryptography',
    mode: 'Online · Global',
    gradient: 4,
    tracks: ['API Protection', 'Supply Chain Security', 'DDoS Mitigation'],
    timeline: [{ label: 'Registration open', when: 'Now' }],
    rules: ['Defensive focus only', 'Live penetration test testbed provided'],
    judging: [{ criteria: 'Resilience under attack', weight: '60%' }, { criteria: 'Zero false positives', weight: '40%' }],
  },
];

// 5. Exactly 10 Codex Entries
const DV_CODEX_SEED = [
  {
    title: 'The bug wasn\u2019t the code — it was the assumption',
    category: 'Debugging',
    authorHandle: 'kmori',
    problem: 'A distributed cache kept serving stale data for one specific customer, but only on Tuesdays. Spent two days assuming it was a TTL bug.',
    tried: 'Rewrote the eviction logic twice. Added more logging. Blamed the cache library. None of it changed anything.',
    fix: 'It wasn\u2019t the cache at all — a cron job that only ran on Tuesdays was writing directly to the same key, bypassing the cache layer entirely.',
    lesson: 'When a bug has a suspiciously specific pattern (one customer, one day), stop debugging the component you suspect and start mapping everything that touches that data.',
  },
  {
    title: 'Why we stopped optimizing before measuring',
    category: 'Performance',
    authorHandle: 'lumen',
    problem: 'Spent a full sprint hand-optimizing a rendering loop everyone "knew" was the bottleneck.',
    tried: 'Manual loop unrolling, object pooling, a custom allocator. Shipped it feeling proud.',
    fix: 'Profiled properly afterward out of curiosity. The loop was 4% of frame time. A single unbatched draw call elsewhere was 60%.',
    lesson: 'Intuition about performance is usually wrong. Profile first, every time, even when — especially when — you\u2019re sure you already know the answer.',
  },
  {
    title: 'The migration that taught me to always have a rollback plan',
    category: 'Architecture',
    authorHandle: 'sena.codes',
    problem: 'Ran a database migration during a maintenance window with no tested rollback path, because "it\u2019s a small change."',
    tried: 'When it failed halfway through, tried to manually reverse it live, under pressure, at 2am.',
    fix: 'Eventually restored from a backup taken twenty minutes before, losing that window\u2019s writes.',
    lesson: 'The size of a migration has nothing to do with how badly it can go wrong. Every migration gets a tested rollback, no exceptions, no matter how "small."',
  },
  {
    title: 'I shipped a quick fix that took production down for six hours',
    category: 'Incidents',
    authorHandle: 'dax',
    problem: 'A customer reported a minor display bug late on a Friday. Pushed a one-line CSS fix directly to production to close the ticket fast.',
    tried: 'When the site went down minutes later, assumed it was unrelated and spent an hour looking elsewhere.',
    fix: 'The "one-line fix" had been auto-formatted by my editor, silently breaking a build config file I hadn\u2019t actually looked at before committing.',
    lesson: 'There is no such thing as a change too small to review. The size of the diff you intended has nothing to do with the size of the diff you shipped.',
  },
  {
    title: 'The interview question that changed how I think about scale',
    category: 'Career',
    authorHandle: 'noa.ml',
    problem: 'Was asked to design a system for "a million users" and jumped straight into sharding and caching layers.',
    tried: 'Built an elaborate answer full of infrastructure the interviewer never asked for.',
    fix: 'The interviewer stopped me and asked what a million users actually meant for this specific product\u2019s access pattern. I hadn\u2019t asked.',
    lesson: '"Scale" is not a number, it\u2019s a shape — read patterns, write patterns, and consistency needs matter far more than raw user count. Ask before you architect.',
  },
  {
    title: 'Nobody warns you how lonely solo projects get',
    category: 'Solo Building',
    authorHandle: 'priya.dev',
    problem: 'Six months into a solo side project with no one to show progress to, motivation quietly died and I didn\u2019t notice until I\u2019d stopped opening the repo entirely.',
    tried: 'Tried to power through with willpower alone. Made it worse — every session felt like an obligation.',
    fix: 'Started posting rough, unfinished progress publicly every week, even when it was ugly. The accountability alone kept it alive.',
    lesson: 'Solo doesn\u2019t have to mean silent. Build some kind of audience — even a small one — before you need the motivation, not after.',
  },
  {
    title: 'The silent deadlock in our database connection pool',
    category: 'Debugging',
    authorHandle: 'elena-v',
    problem: 'Under high traffic spikes, API latency climbed to 30 seconds before failing with 504 Gateway Timeouts. CPU and RAM were under 15%.',
    tried: 'Doubled server instances and horizontally scaled pods. The timeouts immediately spread to the new pods.',
    fix: 'Discovered an unawaited transaction branch holding a pool socket open indefinitely during third-party webhooks. Capped pool timeouts and placed all external calls outside transactions.',
    lesson: 'Never hold a database transaction open while waiting for an external HTTP request. External network latency becomes your database bottleneck.',
  },
  {
    title: 'Baking API secrets into public Docker image layers',
    category: 'Security',
    authorHandle: 'marcus-k',
    problem: 'An internal deployment bot leaked a master Stripe key despite the `.env` file being removed in the final Dockerfile line.',
    tried: 'Added `RUN rm .env` at the bottom of the Dockerfile thinking the image would be clean.',
    fix: 'Understood that Docker stores every layer permanently. Anyone doing `docker history` could inspect the deleted file. Switched to multi-stage builds and Docker secrets mount.',
    lesson: 'Deleting a secret in a later container layer does not remove it from previous layers. Secrets must never enter the build context without runtime secret mounts.',
  },
  {
    title: 'The 200MB memory leak caused by a simple event listener',
    category: 'Performance',
    authorHandle: 'ari-devs',
    problem: 'Single-page application crashed user tabs after approximately 45 minutes of active navigation.',
    tried: 'Suspected large state management objects and tried clearing Redux stores on route changes.',
    fix: 'Chrome Heap Snapshot showed 40,000 DOM nodes retained by window `resize` and `scroll` listeners that were never cleaned up inside disconnected components.',
    lesson: 'Every event listener attached to a global target (`window` or `document`) must have an exact teardown counterpart on component destruction.',
  },
  {
    title: 'How premature microservices crippled a three-person team',
    category: 'Architecture',
    authorHandle: 'devon.codes',
    problem: 'Split an early-stage app into seven independent microservices before reaching product-market fit.',
    tried: 'Added distributed tracing, Kafka queues, and service mesh to diagnose cross-service payload mismatches.',
    fix: 'Consolidated all seven microservices back into a clean modular monolith with single-command deployment. Feature velocity tripled overnight.',
    lesson: 'Microservices solve organizational scaling problems, not code architecture problems. Start with a modular monolith until team size demands service boundaries.',
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Seeding 10 items per category into MongoDB Atlas...');

    // 1. Seed Developers (Users)
    const devMap = {};
    for (const d of DV_DEVS) {
      let user = await User.findOne({ username: d.handle });
      if (!user) {
        user = await User.create({
          name: d.name,
          username: d.handle,
          email: d.email,
          password: 'Password123!',
          avatarSeed: d.avatarSeed,
          points: d.points,
          bio: d.bio,
          skills: d.skills,
          role: 'user',
        });
      }
      devMap[d.handle] = user;
    }
    console.log(`✓ Seeded ${Object.keys(devMap).length} developers`);

    // 2. Seed Projects
    for (const p of DV_PROJECTS) {
      const author = devMap[p.authorHandle] || devMap['kmori'];
      const existing = await Project.findOne({ title: p.title });
      if (!existing) {
        await Project.create({
          title: p.title,
          desc: p.desc,
          category: p.category,
          difficulty: p.difficulty,
          tags: p.tags,
          author: author._id,
          likesCount: p.likesCount,
          viewsCount: p.viewsCount,
          cover: p.art,
          gradient: p.gradient,
          githubUrl: `https://github.com/devverse/${p.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          demoUrl: `https://${p.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.devverse.app`,
          features: ['Realtime sync engine', 'Offline-first caching', 'Zero-config setup', 'Accessible by default'],
          timeline: [
            { label: 'v1.0 released', when: '6 months ago' },
            { label: 'Core rewrite in ' + p.tags[0], when: '3 months ago' },
            { label: '1,000+ stars milestone', when: '3 weeks ago' },
          ],
        });
      }
    }
    console.log(`✓ Seeded ${DV_PROJECTS.length} projects`);

    // 3. Seed Communities & Discussions
    for (const c of DV_COMMUNITIES) {
      let comm = await Community.findOne({ slug: c.slug });
      if (!comm) {
        comm = await Community.create({
          id: c.slug,
          slug: c.slug,
          name: c.name,
          desc: c.desc,
          membersCount: c.membersCount,
          onlineCount: c.onlineCount,
          gradient: c.gradient,
        });

        // Add a sample starter discussion thread
        const author = devMap['kmori'] || Object.values(devMap)[0];
        await Discussion.create({
          community: comm._id,
          communitySlug: c.slug,
          title: `Welcome to the ${c.name} Hub!`,
          body: `This is the official forum for ${c.name}. Introduce yourself, share what you are building, and ask questions!`,
          author: author._id,
          authorName: author.name,
          authorHandle: author.username,
          replies: [
            {
              author: author._id,
              authorName: author.name,
              authorHandle: author.username,
              text: 'Excited to have everyone here. Feel free to start a new thread anytime!',
              createdAt: new Date(),
            },
          ],
        });
      }
    }
    console.log(`✓ Seeded ${DV_COMMUNITIES.length} communities`);

    // 4. Seed Hackathons
    for (const h of DV_HACKATHONS) {
      const existing = await Hackathon.findOne({ title: h.title });
      if (!existing) {
        await Hackathon.create({
          title: h.title,
          desc: h.desc,
          longDesc: h.longDesc,
          prize: h.prize,
          participantsCount: h.participantsCount,
          difficulty: h.difficulty,
          start: new Date(),
          end: h.end,
          tags: h.tags,
          organizer: h.organizer,
          mode: h.mode,
          gradient: h.gradient,
          tracks: h.tracks,
          timeline: h.timeline,
          rules: h.rules,
          judging: h.judging,
        });
      }
    }
    console.log(`✓ Seeded ${DV_HACKATHONS.length} hackathons`);

    // 5. Seed Codex Entries
    for (const ce of DV_CODEX_SEED) {
      const author = devMap[ce.authorHandle] || devMap['kmori'];
      const existing = await CodexEntry.findOne({ title: ce.title });
      if (!existing) {
        await CodexEntry.create({
          title: ce.title,
          category: ce.category,
          author: author._id,
          authorHandle: author.username,
          problem: ce.problem,
          tried: ce.tried,
          fix: ce.fix,
          lesson: ce.lesson,
        });
      }
    }
    console.log(`✓ Seeded ${DV_CODEX_SEED.length} codex entries`);

    console.log('✅ Seeding completed successfully with 10 items in every category.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
