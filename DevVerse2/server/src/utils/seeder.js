// =============================================================================
// Database Seeder — Populates MongoDB Atlas with initial platform catalog
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

const DV_DEVS = [
  { handle: 'kmori', name: 'Kenji Mori', email: 'kmori@devverse.local', avatarSeed: 'kmori', points: 9840, bio: 'Systems engineer obsessed with latency. Building databases that refuse to fall over.', skills: ['Rust', 'Go', 'Distributed Systems'] },
  { handle: 'ari-devs', name: 'Ari Solano', email: 'ari@devverse.local', avatarSeed: 'arisolano', points: 7420, bio: 'Frontend architect. If it doesn\'t feel alive, it isn\'t shipping.', skills: ['React', 'TypeScript', 'Motion Design'] },
  { handle: 'sena.codes', name: 'Sena Park', email: 'sena@devverse.local', avatarSeed: 'senapark', points: 11230, bio: 'Full-stack builder shipping realtime tools for teams that hate meetings.', skills: ['Node.js', 'Vue', 'CRDT'] },
  { handle: 'lumen', name: 'Lumen Cross', email: 'lumen@devverse.local', avatarSeed: 'lumencross', points: 15600, bio: 'Graphics programmer. I make the browser do things it was never asked to do.', skills: ['WebGL', 'Three.js', 'Shaders'] },
  { handle: 'noa.ml', name: 'Noa Reyes', email: 'noa@devverse.local', avatarSeed: 'noareyes', points: 6510, bio: 'ML engineer turning research papers into tools people actually use.', skills: ['Python', 'PyTorch', 'FastAPI'] },
  { handle: 'priya.dev', name: 'Priya Nair', email: 'priya@devverse.local', avatarSeed: 'priyanair', points: 4310, bio: 'Building calm software for busy teams.', skills: ['Vue', 'Node.js', 'Design Systems'] },
  { handle: 'dax', name: 'Dax Whitfield', email: 'dax@devverse.local', avatarSeed: 'daxwhitfield', points: 3020, bio: 'Tooling nerd. I build the things that build the things.', skills: ['Rust', 'CLI', 'DX'] },
  { handle: 'devon.codes', name: 'Devon Blake', email: 'devon@devverse.local', avatarSeed: 'devonblake', points: 5230, bio: 'Web app builder. I like turning a messy spreadsheet workflow into something people actually enjoy opening.', skills: ['JavaScript', 'DOM', 'REST API'] },
];

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
  { legacyId: 'p11', art: 'project-5.png', title: 'Cortex Notes', desc: 'A local-first note app with AI-assisted linking.', tags: ['Next.js', 'SQLite'], difficulty: 'Intermediate', likesCount: 733, viewsCount: 16800, category: 'AI/ML', authorHandle: 'noa.ml', gradient: 0 },
  { legacyId: 'p12', art: 'project-11.png', title: 'Halcyon', desc: 'A minimalist static site generator with island hydration.', tags: ['TypeScript', 'esbuild'], difficulty: 'Beginner', likesCount: 388, viewsCount: 7200, category: 'Tools', authorHandle: 'dax', gradient: 1 },
  { legacyId: 'p13', art: 'project-14.png', title: 'TaskFlow', desc: 'A collaborative task manager with boards, due dates, and live status updates for small teams.', tags: ['JavaScript', 'DOM', 'REST API'], difficulty: 'Beginner', likesCount: 356, viewsCount: 7600, category: 'Web Application', authorHandle: 'devon.codes', gradient: 2 },
  { legacyId: 'p14', art: 'project-12.png', title: 'Ledgerly', desc: 'A browser-based invoicing and expense tracker for freelancers, with data saved locally.', tags: ['JavaScript', 'LocalStorage', 'Fetch API'], difficulty: 'Beginner', likesCount: 214, viewsCount: 5100, category: 'Web Application', authorHandle: 'priya.dev', gradient: 4 },
  { legacyId: 'p15', art: 'project-15.png', title: 'ScoutBoard', desc: 'A job-application tracker web app — log postings, follow-ups, and interview stages in one board.', tags: ['JavaScript', 'Forms', 'JSON'], difficulty: 'Intermediate', likesCount: 297, viewsCount: 6400, category: 'Web Application', authorHandle: 'devon.codes', gradient: 3 },
];

const DV_COMMUNITIES = [
  { legacyId: 'c1', slug: 'rustaceans-guild', name: 'Rustaceans Guild', membersCount: 18200, desc: 'Everything Rust — from borrow-checker fights to production war stories.', gradient: 0, onlineCount: 412 },
  { legacyId: 'c2', slug: 'frontend-atelier', name: 'Frontend Atelier', membersCount: 24500, desc: 'A home for people who care about the pixel and the framework equally.', gradient: 2, onlineCount: 890 },
  { legacyId: 'c3', slug: 'distributed-systems-lab', name: 'Distributed Systems Lab', membersCount: 9100, desc: 'CAP theorem debates, consensus algorithms, and postmortems.', gradient: 1, onlineCount: 205 },
  { legacyId: 'c4', slug: 'ml-practitioners', name: 'ML Practitioners', membersCount: 15300, desc: 'From fine-tuning to inference — practical machine learning talk.', gradient: 3, onlineCount: 560 },
  { legacyId: 'c5', slug: 'indie-hackers-dev', name: 'Indie Hackers Dev', membersCount: 31200, desc: 'Shipping solo projects and side quests into real products.', gradient: 4, onlineCount: 1240 },
  { legacyId: 'c6', slug: 'webgl-shaders', name: 'WebGL & Shaders', membersCount: 6700, desc: 'For people who think the GPU is the most fun part of the browser.', gradient: 0, onlineCount: 140 },
];

const DV_HACKATHONS = [
  {
    legacyId: 'h1',
    title: 'Aurora Hacks 2026',
    desc: 'A 48-hour sprint for tools that make developers faster.',
    longDesc: 'Aurora Hacks is DevVerse\'s flagship open-track event — no theme, no restrictions, just 48 hours to build the developer tool you\'ve been meaning to make. Past winners have gone on to launch as real products.',
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
    rules: ['Teams of up to 4 people', 'All code must be written during the event window', 'Any language or framework is allowed', 'Use of AI coding assistants is allowed and encouraged'],
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
    longDesc: 'A hackathon for people who think in memory addresses. Systems Underground rewards raw performance and correctness over flashy UI — expect judges to actually read your benchmarks.',
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
    rules: ['Solo or teams of up to 3', 'Benchmarks must be reproducible from a public repo', 'No proprietary or closed-source dependencies', 'Judges may ask to run your code live'],
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
    longDesc: 'Not another chatbot wrapper — AI for Builders is judged specifically on tools that make other developers faster or better at their craft. Bring a model, an API, or just a clever prompt pipeline.',
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
    rules: ['Teams of up to 5 people', 'Any model provider or open-weight model is allowed', 'You must disclose which parts were AI-generated vs hand-written', 'Projects must be usable by someone other than the author'],
    judging: [
      { criteria: 'Usefulness to developers', weight: '35%' },
      { criteria: 'Technical execution', weight: '30%' },
      { criteria: 'Originality', weight: '20%' },
      { criteria: 'Presentation', weight: '15%' },
    ],
  },
  {
    legacyId: 'h4',
    title: 'Pixel & Motion',
    desc: 'A hackathon for interfaces that feel like magic.',
    longDesc: 'Pixel & Motion is the friendliest hackathon on DevVerse — built for people who care about how software feels, not just what it does. Beginners are explicitly welcome and mentors are on standby all weekend.',
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
    rules: ['Solo or teams of up to 4', 'Design tools + any frontend framework allowed', 'Must include a short Loom or video walkthrough', 'Mentorship sessions are optional but recommended'],
    judging: [
      { criteria: 'Craft & polish', weight: '35%' },
      { criteria: 'Accessibility', weight: '25%' },
      { criteria: 'Originality', weight: '25%' },
      { criteria: 'Presentation', weight: '15%' },
    ],
  },
];

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
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Seeding initial DevVerse catalog into MongoDB Atlas...');

    // 1. Seed Developers (Users)
    const devMap = {};
    for (const d of DV_DEVS) {
      let user = await User.findOne({ username: d.handle });
      if (!user) {
        user = await User.create({
          name: d.name,
          username: d.handle,
          email: d.email,
          password: 'Password123!', // Standard initial password for demo personas
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
      const existing = await Project.findOne({ legacyId: p.legacyId });
      if (!existing) {
        await Project.create({
          ...p,
          author: author._id,
          isSeeded: true,
        });
      }
    }
    console.log(`✓ Seeded ${DV_PROJECTS.length} projects`);

    // 3. Seed Communities
    const commMap = {};
    for (const c of DV_COMMUNITIES) {
      let community = await Community.findOne({ slug: c.slug });
      if (!community) {
        community = await Community.create(c);
      }
      commMap[c.legacyId] = community;
    }
    console.log(`✓ Seeded ${Object.keys(commMap).length} communities`);

    // 4. Seed Hackathons
    for (const h of DV_HACKATHONS) {
      const existing = await Hackathon.findOne({ legacyId: h.legacyId });
      if (!existing) {
        await Hackathon.create(h);
      }
    }
    console.log(`✓ Seeded ${DV_HACKATHONS.length} hackathons`);

    // 5. Seed Codex Entries
    for (const ce of DV_CODEX_SEED) {
      const author = devMap[ce.authorHandle] || devMap['kmori'];
      const existing = await CodexEntry.findOne({ title: ce.title });
      if (!existing) {
        await CodexEntry.create({
          ...ce,
          author: author._id,
        });
      }
    }
    console.log(`✓ Seeded ${DV_CODEX_SEED.length} codex entries`);

    console.log('✅ Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
