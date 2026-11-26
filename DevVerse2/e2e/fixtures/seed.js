const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { E2E_MONGO_URI } = require('./env');

const SEED_PASSWORD = 'Password123!';

const COLLECTIONS = [
  'users',
  'projects',
  'comments',
  'communities',
  'discussions',
  'codexentries',
  'hackathons',
  'hackathonregistrations',
  'squads',
  'portfolios',
  'activities',
  'engagements',
  'messages',
];

const SEED_USER_SPECS = [
  {
    name: 'Newcomer Builder',
    username: 'newcomer',
    email: 'newcomer@devverse.test',
    points: 20,
    skills: ['JavaScript', 'React', 'CSS'],
    categories: ['Frontend', 'Tools'],
    style: 'either',
    bio: 'Just getting started on DevVerse.',
    github: 'newcomer-dev',
  },
  {
    name: 'Near Codex',
    username: 'nearcodex',
    email: 'nearcodex@devverse.test',
    points: 180,
    skills: ['TypeScript', 'Node.js', 'React'],
    categories: ['Backend', 'Frontend'],
    style: 'either',
    bio: 'Almost at the 200-point Codex threshold.',
    github: 'nearcodex-dev',
  },
  {
    name: 'Codex Contributor',
    username: 'codexuser',
    email: 'codexuser@devverse.test',
    points: 220,
    skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
    categories: ['Frontend', 'Architecture'],
    style: 'complement',
    bio: 'Unlocked the Codex knowledge base.',
    github: 'codexuser-dev',
  },
  {
    name: 'Near Legend',
    username: 'nearlegend',
    email: 'nearlegend@devverse.test',
    points: 599,
    skills: ['Rust', 'Systems', 'WebGL'],
    categories: ['Systems', 'Graphics'],
    style: 'similar',
    bio: 'One point away from Legend tier.',
    github: 'nearlegend-dev',
  },
  {
    name: 'Legend Architect',
    username: 'legenduser',
    email: 'legenduser@devverse.test',
    points: 650,
    skills: ['Rust', 'Distributed Systems', 'React', 'WebGL'],
    categories: ['Systems', 'Frontend'],
    style: 'either',
    bio: 'Reached Legend tier and building open-source infra.',
    github: 'legenduser-dev',
  },
  // 10 catalog developers (Squad matching, Leaderboard, Hackathon participants)
  {
    name: 'Kai Mori',
    username: 'kmori',
    email: 'kmori@devverse.test',
    points: 540,
    skills: ['Rust', 'WebAssembly', 'Systems', 'TypeScript'],
    categories: ['Systems', 'Tools'],
    style: 'complement',
    bio: 'Systems & WebAssembly engineer.',
    github: 'kmori',
  },
  {
    name: 'Ari Vance',
    username: 'ari-devs',
    email: 'ari-devs@devverse.test',
    points: 490,
    skills: ['TypeScript', 'React', 'Three.js', 'WebGL'],
    categories: ['Frontend', 'Graphics'],
    style: 'either',
    bio: 'Creative frontend & shaders builder.',
    github: 'ari-devs',
  },
  {
    name: 'Sena Takahashi',
    username: 'sena.codes',
    email: 'sena.codes@devverse.test',
    points: 430,
    skills: ['Python', 'PyTorch', 'AI/ML', 'FastAPI'],
    categories: ['AI/ML', 'Backend'],
    style: 'complement',
    bio: 'ML inference & tooling specialist.',
    github: 'sena-codes',
  },
  {
    name: 'Lumen Park',
    username: 'lumen',
    email: 'lumen@devverse.test',
    points: 380,
    skills: ['WebGL', 'GLSL', 'Graphics', 'React'],
    categories: ['Graphics', 'Frontend'],
    style: 'similar',
    bio: 'Real-time graphics & aurora shaders.',
    github: 'lumen-gfx',
  },
  {
    name: 'Noa Lin',
    username: 'noa.ml',
    email: 'noa.ml@devverse.test',
    points: 340,
    skills: ['Python', 'CUDA', 'AI/ML', 'Rust'],
    categories: ['AI/ML', 'Systems'],
    style: 'either',
    bio: 'Local LLM runtimes and quantizers.',
    github: 'noa-ml',
  },
  {
    name: 'Priya Nair',
    username: 'priya.dev',
    email: 'priya.dev@devverse.test',
    points: 290,
    skills: ['Go', 'Kubernetes', 'Backend', 'PostgreSQL'],
    categories: ['Backend', 'Tools'],
    style: 'complement',
    bio: 'Distributed queues and cloud telemetry.',
    github: 'priya-dev',
  },
  {
    name: 'Dax Sterling',
    username: 'dax',
    email: 'dax@devverse.test',
    points: 250,
    skills: ['C++', 'Compilers', 'Systems', 'Rust'],
    categories: ['Systems', 'Tools'],
    style: 'similar',
    bio: 'Compiler passes and zero-copy parsers.',
    github: 'dax-sys',
  },
  {
    name: 'Devon Brooks',
    username: 'devon.codes',
    email: 'devon.codes@devverse.test',
    points: 210,
    skills: ['React', 'Next.js', 'Frontend', 'Tailwind'],
    categories: ['Frontend'],
    style: 'either',
    bio: 'Design systems and accessibility.',
    github: 'devon-codes',
  },
  {
    name: 'Elena Volkov',
    username: 'elena-v',
    email: 'elena-v@devverse.test',
    points: 160,
    skills: ['GraphQL', 'Node.js', 'PostgreSQL', 'TypeScript'],
    categories: ['Backend', 'Frontend'],
    style: 'complement',
    bio: 'API gateway and schema federation.',
    github: 'elena-v',
  },
  {
    name: 'Marcus Kim',
    username: 'marcus-k',
    email: 'marcus-k@devverse.test',
    points: 110,
    skills: ['Docker', 'Terraform', 'Go', 'Linux'],
    categories: ['Tools', 'Backend'],
    style: 'either',
    bio: 'Developer tooling and reproducible CI.',
    github: 'marcus-k',
  },
];

let cachedPasswordHash = null;

async function ensureConnected(mongoUri = E2E_MONGO_URI) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

async function disconnectSeedDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function seedDatabase(mongoUri = E2E_MONGO_URI) {
  const conn = await ensureConnected(mongoUri);
  const db = conn.db;

  // Preserve unique indexes by using deleteMany({}) rather than dropDatabase()
  for (const colName of COLLECTIONS) {
    try {
      await db.collection(colName).deleteMany({});
    } catch (_err) {
      // Collection may not exist yet on first run
    }
  }

  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  }

  const now = new Date();
  const userDocs = [];
  const userByUsername = {};

  for (let i = 0; i < SEED_USER_SPECS.length; i += 1) {
    const spec = SEED_USER_SPECS[i];
    const _id = new mongoose.Types.ObjectId();
    const doc = {
      _id,
      name: spec.name,
      username: spec.username.toLowerCase(),
      email: spec.email.toLowerCase(),
      password: cachedPasswordHash,
      provider: 'local',
      providerId: '',
      role: 'user',
      bio: spec.bio,
      github: spec.github,
      avatarSeed: spec.username.toLowerCase(),
      avatarUrl: '',
      points: spec.points,
      skills: spec.skills,
      usernameChangeUsed: false,
      settings: {
        theme: 'dark',
        accent: 'violet',
        motion: 'on',
      },
      squadFinderProfile: {
        skills: spec.skills,
        categories: spec.categories,
        style: spec.style,
      },
      createdAt: new Date(now.getTime() - (30 - i) * 86400_000),
      updatedAt: now,
    };
    userDocs.push(doc);
    userByUsername[doc.username] = doc;
  }

  await db.collection('users').insertMany(userDocs);

  // Matching initial Activity records so GET /activity/me does not backfill unexpectedly
  const activityDocs = userDocs.map((u) => ({
    _id: new mongoose.Types.ObjectId(),
    user: u._id,
    amount: u.points,
    reason: 'Welcome bonus — Account created',
    bucket: 'register',
    entityId: null,
    createdAt: new Date(now.getTime() - 3600_000),
    updatedAt: now,
  }));
  await db.collection('activities').insertMany(activityDocs);

  // 10+ deterministic projects (including authorHandle, art, legacyId p1..p10)
  const projectSpecs = [
    {
      legacyId: 'p1',
      title: 'Aurora Shader Studio',
      desc: 'Interactive WebGL aurora and volumetric mesh shader playground with live GLSL uniform controls.',
      authorUsername: 'kmori',
      category: 'Graphics',
      difficulty: 'Advanced',
      tags: ['WebGL', 'GLSL', 'TypeScript', 'Aurora'],
      features: ['Live uniform editor', '60fps post-processing', 'Preset exporter'],
      art: 'project-1.png',
      gradient: 0,
      likesCount: 48,
      viewsCount: 412,
      githubUrl: 'https://github.com/kmori/aurora-shader-studio',
    },
    {
      legacyId: 'p2',
      title: 'PulseQueue Telemetry',
      desc: 'Zero-allocation distributed job queue monitor built with Go, WebSockets, and time-series sparklines.',
      authorUsername: 'priya.dev',
      category: 'Backend',
      difficulty: 'Intermediate',
      tags: ['Go', 'WebSockets', 'Telemetry', 'Backend'],
      features: ['Dead-letter replay', 'Worker lag histograms', 'Prometheus exporter'],
      art: 'project-2.png',
      gradient: 1,
      likesCount: 41,
      viewsCount: 320,
      githubUrl: 'https://github.com/priya-dev/pulsequeue',
    },
    {
      legacyId: 'p3',
      title: 'SynthGrid Design System',
      desc: 'Accessible dark glassmorphism component library with keyboard-first focus rings and theme tokens.',
      authorUsername: 'devon.codes',
      category: 'Frontend',
      difficulty: 'Beginner',
      tags: ['React', 'Tailwind', 'Accessibility', 'Design'],
      features: ['WCAG AA contrast tokens', 'Command palette primitive', 'Zero-runtime CSS vars'],
      art: 'project-3.png',
      gradient: 2,
      likesCount: 37,
      viewsCount: 285,
      githubUrl: 'https://github.com/devon-codes/synthgrid',
    },
    {
      legacyId: 'p4',
      title: 'Kestrel Wasm Runtime',
      desc: 'Sandboxed WebAssembly plugin runner in Rust with deterministic fuel metering and host bindings.',
      authorUsername: 'dax',
      category: 'Systems',
      difficulty: 'Advanced',
      tags: ['Rust', 'WebAssembly', 'Systems', 'Sandbox'],
      features: ['Instruction fuel caps', 'Memory snapshots', 'Async host calls'],
      art: 'project-4.png',
      gradient: 3,
      likesCount: 34,
      viewsCount: 240,
      githubUrl: 'https://github.com/dax-sys/kestrel-wasm',
    },
    {
      legacyId: 'p5',
      title: 'VectorForge Local RAG',
      desc: 'Offline semantic code search engine indexing local repositories with quantized embeddings.',
      authorUsername: 'sena.codes',
      category: 'AI/ML',
      difficulty: 'Intermediate',
      tags: ['Python', 'PyTorch', 'Embeddings', 'AI/ML'],
      features: ['AST-aware chunking', 'Cosine HNSW index', 'CLI & HTTP API'],
      art: 'project-5.png',
      gradient: 4,
      likesCount: 29,
      viewsCount: 210,
      githubUrl: 'https://github.com/sena-codes/vectorforge',
    },
    {
      legacyId: 'p6',
      title: 'Nebula Mesh Raymarcher',
      desc: 'Signed distance field raymarching studio supporting CSG primitives and soft shadows in the browser.',
      authorUsername: 'lumen',
      category: 'Graphics',
      difficulty: 'Advanced',
      tags: ['GLSL', 'Raymarching', 'WebGL', 'Math'],
      features: ['SDF boolean ops', 'Ambient occlusion', 'OBJ snapshot export'],
      art: 'project-1.png',
      gradient: 0,
      likesCount: 25,
      viewsCount: 195,
      githubUrl: 'https://github.com/lumen-gfx/nebula-raymarcher',
    },
    {
      legacyId: 'p7',
      title: 'DriftCheck Schema Diff',
      desc: 'Automated PostgreSQL and MongoDB index drift checker for CI/CD pull request gates.',
      authorUsername: 'elena-v',
      category: 'Tools',
      difficulty: 'Beginner',
      tags: ['Node.js', 'PostgreSQL', 'CLI', 'CI'],
      features: ['Zero-lock migrations', 'JSON SARIF output', 'GitHub Action ready'],
      art: 'project-2.png',
      gradient: 1,
      likesCount: 22,
      viewsCount: 170,
      githubUrl: 'https://github.com/elena-v/driftcheck',
    },
    {
      legacyId: 'p8',
      title: 'TensorTrace Profiler',
      desc: 'Lightweight CUDA kernel timeline flamegraph viewer for PyTorch training loops.',
      authorUsername: 'noa.ml',
      category: 'AI/ML',
      difficulty: 'Intermediate',
      tags: ['CUDA', 'Python', 'Profiling', 'PyTorch'],
      features: ['Memory allocation tracker', 'Kernel overlap view', 'Chrome trace import'],
      art: 'project-3.png',
      gradient: 2,
      likesCount: 18,
      viewsCount: 155,
      githubUrl: 'https://github.com/noa-ml/tensortrace',
    },
    {
      legacyId: 'p9',
      title: 'OrbitCLI Task Runner',
      desc: 'Parallel monorepo task runner with content-addressed local build caching and TUI logs.',
      authorUsername: 'marcus-k',
      category: 'Tools',
      difficulty: 'Beginner',
      tags: ['Go', 'CLI', 'Monorepo', 'DevOps'],
      features: ['DAG execution', 'Hash cache', 'Watch mode'],
      art: 'project-4.png',
      gradient: 3,
      likesCount: 14,
      viewsCount: 120,
      githubUrl: 'https://github.com/marcus-k/orbitcli',
    },
    {
      legacyId: 'p10',
      title: 'Chronicle Notes Engine',
      desc: 'Local-first markdown knowledge graph with bidirectional backlinks and instant full-text search.',
      authorUsername: 'codexuser',
      category: 'Frontend',
      difficulty: 'Intermediate',
      tags: ['React', 'TypeScript', 'IndexedDB', 'Graph'],
      features: ['Backlink graph', 'Vim keybindings', 'Offline sync'],
      art: 'project-5.png',
      gradient: 4,
      likesCount: 11,
      viewsCount: 95,
      githubUrl: 'https://github.com/codexuser-dev/chronicle-notes',
    },
  ];

  const projectDocs = projectSpecs.map((p, idx) => {
    const author = userByUsername[p.authorUsername];
    return {
      _id: new mongoose.Types.ObjectId(),
      legacyId: p.legacyId,
      title: p.title,
      desc: p.desc,
      author: author._id,
      authorHandle: author.username,
      category: p.category,
      art: p.art,
      gradient: p.gradient,
      tags: p.tags,
      difficulty: p.difficulty,
      githubUrl: p.githubUrl,
      features: p.features,
      images: [],
      timeline: [
        { label: 'Initial prototype', when: '2 weeks ago' },
        { label: 'Public v1.0 release', when: '3 days ago' },
      ],
      likesCount: p.likesCount,
      viewsCount: p.viewsCount,
      isSeeded: true,
      createdAt: new Date(now.getTime() - (15 - idx) * 86400_000),
      updatedAt: now,
    };
  });
  await db.collection('projects').insertMany(projectDocs);

  // Seed initial comments on p1
  await db.collection('comments').insertMany([
    {
      _id: new mongoose.Types.ObjectId(),
      project: projectDocs[0]._id,
      author: userByUsername['ari-devs']._id,
      authorHandle: 'ari-devs',
      authorName: 'Ari Vance',
      text: 'The volumetric aurora pass runs silky smooth at 60fps!',
      createdAt: new Date(now.getTime() - 7200_000),
      updatedAt: now,
    },
  ]);

  // 6 future hackathons (h1..h6) + 1 past-end hackathon (h-live) for "Live now" boundary
  const hackathonSpecs = [
    {
      legacyId: 'h1',
      title: 'Aurora Global AI & Systems Hackathon',
      desc: '48-hour build sprint focused on local AI runtimes, WebGL visuals, and developer tools.',
      longDesc:
        'Join builders worldwide for a weekend of high-craft systems, graphics, and AI applications.',
      prize: '₹2,50,000',
      end: new Date(now.getTime() + 14 * 86400_000),
      organizer: 'DevVerse Foundation',
      participantsCount: 142,
      difficulty: 'All levels',
      tags: ['AI/ML', 'Systems', 'Graphics'],
      mode: 'Online · Global',
      gradient: 0,
      tracks: ['Local AI', 'Creative WebGL', 'Developer Infra'],
      timeline: [
        { label: 'Kickoff & Team Formation', when: 'Day 1 · 09:00 UTC' },
        { label: 'Midpoint Check-in', when: 'Day 2 · 12:00 UTC' },
        { label: 'Submissions Due', when: 'Day 3 · 18:00 UTC' },
      ],
      rules: [
        'All code must be written during the hackathon window.',
        'Teams of 1 to 4 builders are permitted.',
        'Open-source dependencies must be clearly attributed.',
      ],
      judging: [
        { criteria: 'Technical Execution', weight: '35%' },
        { criteria: 'Originality & Craft', weight: '30%' },
        { criteria: 'Demo & Usability', weight: '20%' },
        { criteria: 'Real-World Impact', weight: '15%' },
      ],
    },
    {
      legacyId: 'h2',
      title: 'Zero-Latency Backend Challenge',
      desc: 'Build resilient distributed queues, edge caches, and real-time observability dashboards.',
      longDesc: 'Push throughput and tail latency limits across distributed services.',
      prize: '₹1,50,000',
      end: new Date(now.getTime() + 21 * 86400_000),
      organizer: 'CloudCraft Guild',
      participantsCount: 98,
      difficulty: 'Intermediate',
      tags: ['Backend', 'Go', 'Rust'],
      mode: 'Online · Global',
      gradient: 1,
      tracks: ['Streaming Pipelines', 'Edge KV', 'Telemetry'],
      timeline: [
        { label: 'Opening Ceremony', when: 'Week 1' },
        { label: 'Load Test Benchmarks', when: 'Week 2' },
      ],
      rules: [
        'Reproducible benchmarks required.',
        'Maximum 4 contributors per squad.',
      ],
      judging: [
        { criteria: 'Throughput & Latency', weight: '40%' },
        { criteria: 'Fault Tolerance', weight: '35%' },
        { criteria: 'Documentation', weight: '25%' },
      ],
    },
    {
      legacyId: 'h3',
      title: 'Glass & Motion UI Jam',
      desc: 'Craft accessible, keyboard-friendly web interfaces with crisp typography and motion.',
      longDesc: 'Design and implement expressive React interfaces that honor reduced-motion preferences.',
      prize: '₹1,00,000',
      end: new Date(now.getTime() + 28 * 86400_000),
      organizer: 'PixelFoundry',
      participantsCount: 115,
      difficulty: 'Beginner friendly',
      tags: ['Frontend', 'React', 'Accessibility'],
      mode: 'Online · Global',
      gradient: 2,
      tracks: ['Design Systems', 'Data Visualizations', '3D Canvas'],
      timeline: [
        { label: 'Theme Reveal', when: 'Friday' },
        { label: 'Final Demos', when: 'Sunday' },
      ],
      rules: ['Must pass keyboard navigation checks.', 'Respect prefers-reduced-motion.'],
      judging: [
        { criteria: 'Visual Polish', weight: '40%' },
        { criteria: 'Accessibility', weight: '35%' },
        { criteria: 'Code Quality', weight: '25%' },
      ],
    },
    {
      legacyId: 'h4',
      title: 'Rust & Wasm Microkernel Sprint',
      desc: 'Explore memory-safe plugins, sandboxes, and cross-platform CLI utilities.',
      longDesc: 'Build compact, deterministic binaries compiled to WebAssembly or native targets.',
      prize: '₹1,75,000',
      end: new Date(now.getTime() + 35 * 86400_000),
      organizer: 'Systems Collective',
      participantsCount: 74,
      difficulty: 'Advanced',
      tags: ['Rust', 'WebAssembly', 'Systems'],
      mode: 'Online · Global',
      gradient: 3,
      tracks: ['WASI Components', 'CLI Utilities', 'Embedded'],
      timeline: [{ label: 'Sprint Start', when: 'Next Month' }],
      rules: ['Unsafe blocks must be documented.'],
      judging: [
        { criteria: 'Safety & Correctness', weight: '50%' },
        { criteria: 'Performance', weight: '50%' },
      ],
    },
    {
      legacyId: 'h5',
      title: 'Open DevTools Weekend',
      desc: 'Ship linters, profilers, debuggers, and productivity tools developers love.',
      longDesc: 'Solve everyday developer friction with clean, fast tools.',
      prize: '₹80,000',
      end: new Date(now.getTime() + 42 * 86400_000),
      organizer: 'DevVerse Builders',
      participantsCount: 89,
      difficulty: 'All levels',
      tags: ['Tools', 'CLI', 'DX'],
      mode: 'Online · Global',
      gradient: 4,
      tracks: ['Editor Plugins', 'Testing Tools', 'Build Systems'],
      timeline: [{ label: 'Demo Day', when: 'In 6 Weeks' }],
      rules: ['MIT or Apache-2.0 license required.'],
      judging: [
        { criteria: 'Developer Impact', weight: '50%' },
        { criteria: 'Reliability', weight: '50%' },
      ],
    },
    {
      legacyId: 'h6',
      title: 'Applied Security & Privacy Hack',
      desc: 'Build local-first encryption, CSRF/auth auditing tools, and secret scanners.',
      longDesc: 'Harden modern web and API architectures against real-world threat models.',
      prize: '₹2,00,000',
      end: new Date(now.getTime() + 50 * 86400_000),
      organizer: 'CipherLab',
      participantsCount: 64,
      difficulty: 'Intermediate',
      tags: ['Security', 'Auth', 'Crypto'],
      mode: 'Online · Global',
      gradient: 0,
      tracks: ['Auth Hardening', 'Static Analysis', 'Zero-Knowledge'],
      timeline: [{ label: 'Threat Model Review', when: 'In 7 Weeks' }],
      rules: ['No offensive exploits against live third-party targets.'],
      judging: [
        { criteria: 'Security Rigor', weight: '60%' },
        { criteria: 'Usability', weight: '40%' },
      ],
    },
    {
      legacyId: 'h-live',
      title: 'Midnight Live Ship Sprint',
      desc: 'Active live-now build window verifying zero/negative countdown clamping.',
      longDesc: 'Currently live hackathon sprint in final judging.',
      prize: '₹60,000',
      end: new Date(now.getTime() - 3600_000),
      organizer: 'DevVerse Live',
      participantsCount: 53,
      difficulty: 'All levels',
      tags: ['Fullstack', 'Live'],
      mode: 'Online · Global',
      gradient: 1,
      tracks: ['Rapid Prototypes'],
      timeline: [{ label: 'Live Now', when: 'Ongoing' }],
      rules: ['Ship a working live demo.'],
      judging: [{ criteria: 'Execution', weight: '100%' }],
    },
  ];

  const hackathonDocs = hackathonSpecs.map((h, idx) => ({
    _id: new mongoose.Types.ObjectId(),
    ...h,
    createdAt: new Date(now.getTime() - (10 - idx) * 86400_000),
    updatedAt: now,
  }));
  await db.collection('hackathons').insertMany(hackathonDocs);

  // Seed initial HackathonRegistrations for catalog devs (NOT newcomer/codexuser)
  await db.collection('hackathonregistrations').insertMany([
    {
      _id: new mongoose.Types.ObjectId(),
      user: userByUsername['kmori']._id,
      hackathon: hackathonDocs[0]._id,
      squad: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      user: userByUsername['ari-devs']._id,
      hackathon: hackathonDocs[0]._id,
      squad: null,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 6 Communities (membersCount <= 11 so communityController does not clamp/overwrite)
  const communitySpecs = [
    {
      legacyId: 'c1',
      name: 'Systems & Rust Guild',
      slug: 'systems-rust-guild',
      desc: 'Low-level programming, memory safety, async runtimes, and WebAssembly.',
      gradient: 0,
      membersCount: 7,
      onlineCount: 2,
    },
    {
      legacyId: 'c2',
      name: 'Frontend Craft & Motion',
      slug: 'frontend-craft-motion',
      desc: 'React architecture, accessibility, Tailwind design systems, and shaders.',
      gradient: 1,
      membersCount: 6,
      onlineCount: 2,
    },
    {
      legacyId: 'c3',
      name: 'Applied AI Builders',
      slug: 'applied-ai-builders',
      desc: 'Local inference, evaluation harnesses, embeddings, and agent workflows.',
      gradient: 2,
      membersCount: 5,
      onlineCount: 1,
    },
    {
      legacyId: 'c4',
      name: 'Distributed Backend Ops',
      slug: 'distributed-backend-ops',
      desc: 'Queues, database indexing, zero-downtime migrations, and observability.',
      gradient: 3,
      membersCount: 5,
      onlineCount: 1,
    },
    {
      legacyId: 'c5',
      name: 'Graphics & Shaders Lab',
      slug: 'graphics-shaders-lab',
      desc: 'WebGL, Three.js, GLSL raymarching, and GPU compute pipelines.',
      gradient: 4,
      membersCount: 4,
      onlineCount: 1,
    },
    {
      legacyId: 'c6',
      name: 'Solo Shippers Club',
      slug: 'solo-shippers-club',
      desc: 'Shipping indie developer products from idea to production sustainably.',
      gradient: 0,
      membersCount: 4,
      onlineCount: 1,
    },
  ];

  const communityDocs = communitySpecs.map((c, idx) => ({
    _id: new mongoose.Types.ObjectId(),
    ...c,
    createdAt: new Date(now.getTime() - (12 - idx) * 86400_000),
    updatedAt: now,
  }));
  await db.collection('communities').insertMany(communityDocs);

  // Starter Discussions with replies
  const discussionDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      community: communityDocs[0]._id,
      communitySlug: communityDocs[0].slug,
      title: 'Zero-copy ring buffers in Wasm host bindings',
      body: 'Sharing benchmarks from moving JSON serialization to shared linear memory slices between Rust and JS.',
      author: userByUsername['kmori']._id,
      authorHandle: 'kmori',
      authorName: 'Kai Mori',
      replies: [
        {
          _id: new mongoose.Types.ObjectId(),
          author: userByUsername['dax']._id,
          authorHandle: 'dax',
          authorName: 'Dax Sterling',
          text: 'Aligning descriptors to 8-byte boundaries cut our parse overhead in half.',
          createdAt: new Date(now.getTime() - 3600_000),
          updatedAt: now,
        },
      ],
      repliesCount: 1,
      createdAt: new Date(now.getTime() - 7200_000),
      updatedAt: now,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      community: communityDocs[1]._id,
      communitySlug: communityDocs[1].slug,
      title: 'Respecting reduced motion without losing visual hierarchy',
      body: 'How we structure glassmorphism depth, focus rings, and instant state transitions when motion is off.',
      author: userByUsername['devon.codes']._id,
      authorHandle: 'devon.codes',
      authorName: 'Devon Brooks',
      replies: [
        {
          _id: new mongoose.Types.ObjectId(),
          author: userByUsername['ari-devs']._id,
          authorHandle: 'ari-devs',
          authorName: 'Ari Vance',
          text: 'Swapping slide transitions for opacity fades feels crisp and avoids vestibular strain.',
          createdAt: new Date(now.getTime() - 1800_000),
          updatedAt: now,
        },
      ],
      repliesCount: 1,
      createdAt: new Date(now.getTime() - 5400_000),
      updatedAt: now,
    },
  ];
  await db.collection('discussions').insertMany(discussionDocs);

  // 6 Codex entries spanning categories
  const codexSpecs = [
    {
      title: 'Diagnosing intermittent MongoDB unique index race conditions',
      category: 'Debugging',
      problem:
        'Concurrent toggle requests triggered duplicate key E11000 errors when using findOne followed by insert.',
      tried: 'Added client-side button debouncing, which still failed across multiple browser tabs.',
      fix: 'Switched to atomic findOneAndDelete / upsert patterns with partial unique indexes on engagement pairs.',
      lesson: 'Database uniqueness constraints and atomic operations must guard against concurrent mutations.',
      authorUsername: 'kmori',
    },
    {
      title: 'Preventing WebGL context loss on mobile Safari and Chrome',
      category: 'Performance',
      problem:
        'Multiple canvas instances across route transitions exhausted active WebGL contexts on mobile devices.',
      tried: 'Lowered pixel ratio to 1.0, which delayed the crash but did not eliminate context leaks.',
      fix: 'Explicitly dispose geometries, materials, and forceContextLoss in React effect cleanup on unmount.',
      lesson: 'Every GPU resource allocated in a canvas effect needs deterministic teardown.',
      authorUsername: 'lumen',
    },
    {
      title: 'Hybrid HttpOnly cookie plus Bearer token CSRF architecture',
      category: 'Security',
      problem:
        'Cross-origin Vite dev proxies and local HTTP servers tripped strict SameSite=None cookie rules.',
      tried: 'Disabled CSRF checks in development, creating divergence between dev and prod behavior.',
      fix: 'Kept strict Origin validation for cookie-only requests while exempting explicit Bearer headers.',
      lesson: 'Explicit Authorization headers provide clean CSRF immunity across proxy topologies.',
      authorUsername: 'priya.dev',
    },
    {
      title: 'Code-splitting 16 SPA routes with predictable Suspense boundaries',
      category: 'Architecture',
      problem:
        'Bundling all pages and 3D shaders into a single chunk slowed initial Time to Interactive.',
      tried: 'Manual dynamic imports inside page effects, causing layout shift.',
      fix: 'Paired React.lazy route chunks with a shared ErrorBoundary and minimal skeleton fallback.',
      lesson: 'Route-level splitting keeps initial payloads lean while preserving fast navigation.',
      authorUsername: 'devon.codes',
    },
    {
      title: 'Surviving a production rate-limiter lockout during load tests',
      category: 'Incidents',
      problem:
        'Automated test suites hit the 30-request auth limiter after running sequential login flows.',
      tried: 'Increased timeouts, which only made runs slower without resetting the 15-minute window.',
      fix: 'Isolated E2E runs with NODE_ENV=test and a dedicated wrapper entrypoint calling startServer().',
      lesson: 'Never test against shared production environments or rate-limited auth endpoints.',
      authorUsername: 'marcus-k',
    },
    {
      title: 'Scoping solo weekend builds to shippable vertical slices',
      category: 'Solo Building',
      problem:
        'Over-engineering auth, billing, and notifications stalled initial releases for weeks.',
      tried: 'Built a generic microservices template before validating core user workflows.',
      fix: 'Defined one end-to-end vertical slice per day and automated smoke checks early.',
      lesson: 'Working vertical slices beat premature abstraction every single time.',
      authorUsername: 'codexuser',
    },
  ];

  const codexDocs = codexSpecs.map((c, idx) => {
    const author = userByUsername[c.authorUsername];
    return {
      _id: new mongoose.Types.ObjectId(),
      title: c.title,
      category: c.category,
      problem: c.problem,
      tried: c.tried,
      fix: c.fix,
      lesson: c.lesson,
      author: author._id,
      authorHandle: author.username,
      createdAt: new Date(now.getTime() - (8 - idx) * 86400_000),
      updatedAt: now,
    };
  });
  await db.collection('codexentries').insertMany(codexDocs);

  // Initial Portfolio docs for key users
  const portfolioUsers = ['newcomer', 'codexuser', 'legenduser', 'kmori', 'ari-devs'];
  const portfolioDocs = portfolioUsers.map((handle) => {
    const u = userByUsername[handle];
    return {
      _id: new mongoose.Types.ObjectId(),
      user: u._id,
      handle: u.username,
      name: u.name,
      title: 'Fullstack & Systems Builder',
      bio: u.bio,
      avatarSeed: u.avatarSeed,
      accent: '#7c6fff',
      skills: u.skills,
      links: [
        { label: 'GitHub', url: `https://github.com/${u.github || u.username}` },
      ],
      projects: [
        {
          title: `${u.name.split(' ')[0]} Starter Kit`,
          desc: 'Curated open-source engineering starter project.',
          githubUrl: `https://github.com/${u.github || u.username}/starter`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  });
  await db.collection('portfolios').insertMany(portfolioDocs);

  // Initial Squad doc (owned by kmori & ari-devs, leaving test users free to create/join)
  await db.collection('squads').insertOne({
    _id: new mongoose.Types.ObjectId(),
    name: 'Aurora Systems Collective',
    description: 'Building WebGL shaders and Wasm runtimes for the Aurora Hackathon.',
    leader: userByUsername['kmori']._id,
    members: [userByUsername['kmori']._id, userByUsername['ari-devs']._id],
    registeredHackathons: [hackathonDocs[0]._id],
    createdAt: now,
    updatedAt: now,
  });

  return {
    users: userDocs.length,
    projects: projectDocs.length,
    hackathons: hackathonDocs.length,
    communities: communityDocs.length,
    discussions: discussionDocs.length,
    codexEntries: codexDocs.length,
    portfolios: portfolioDocs.length,
  };
}

async function setUserPoints(username, points, mongoUri = E2E_MONGO_URI) {
  const conn = await ensureConnected(mongoUri);
  const db = conn.db;
  const user = await db
    .collection('users')
    .findOne({ username: username.toLowerCase() });
  if (!user) {
    throw new Error(`setUserPoints: user @${username} not found`);
  }
  await db
    .collection('users')
    .updateOne({ _id: user._id }, { $set: { points, updatedAt: new Date() } });
  await db.collection('activities').deleteMany({ user: user._id });
  await db.collection('activities').insertOne({
    _id: new mongoose.Types.ObjectId(),
    user: user._id,
    amount: points,
    reason: 'Seeded baseline points',
    bucket: 'register',
    entityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

module.exports = {
  SEED_PASSWORD,
  SEED_USER_SPECS,
  ensureConnected,
  disconnectSeedDb,
  seedDatabase,
  setUserPoints,
};
