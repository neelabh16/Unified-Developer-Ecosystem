// =============================================================================
// Hackathon Lookup & Canonical Identifier Resolver
// =============================================================================
const mongoose = require('mongoose');
const Hackathon = require('../models/Hackathon');

const HACKATHON_MAP = {
  h1: { title: 'Aurora Hacks 2026', slugs: ['aurora-hacks-2026', 'aurora-hacks'] },
  h2: { title: 'Systems Underground', slugs: ['systems-underground'] },
  h3: { title: 'AI for Builders', slugs: ['ai-for-builders'] },
  h4: { title: 'Pixel & Motion', slugs: ['pixel-and-motion', 'pixel-&--motion', 'pixel-motion', 'pixel & motion'] },
  h5: { title: 'Edge Cloud Sprint', slugs: ['edge-cloud-sprint'] },
  h6: { title: 'Zero-Knowledge Jam', slugs: ['zero-knowledge-jam', 'zero-knowledge'] },
  h7: { title: 'Open Source Revival', slugs: ['open-source-revival'] },
  h8: { title: 'Mobile-First Odyssey', slugs: ['mobile-first-odyssey', 'mobile-first'] },
  h9: { title: 'Browser Game Jam', slugs: ['browser-game-jam'] },
  h10: { title: 'Cyber Defense Crucible', slugs: ['cyber-defense-crucible'] },
};

async function findHackathonByIdentifier(id) {
  if (!id) return null;
  const rawId = id.toString().trim();

  // 1. Valid ObjectId
  if (mongoose.Types.ObjectId.isValid(rawId)) {
    const h = await Hackathon.findById(rawId);
    if (h) return h;
  }

  // 2. Exact match on legacyId
  let h = await Hackathon.findOne({ legacyId: rawId });
  if (h) return h;

  // 3. Match against known canonical ID map
  const lower = rawId.toLowerCase();
  for (const [key, meta] of Object.entries(HACKATHON_MAP)) {
    if (key === lower || meta.title.toLowerCase() === lower || meta.slugs.includes(lower)) {
      h = await Hackathon.findOne({
        $or: [
          { legacyId: key },
          { legacyId: { $in: meta.slugs } },
          { title: { $regex: new RegExp('^' + meta.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        ],
      });
      if (h) return h;
    }
  }

  // 4. Loose title regex match
  h = await Hackathon.findOne({
    title: { $regex: new RegExp(rawId.replace(/[-_]/g, ' '), 'i') },
  });
  if (h) return h;

  // 5. Try case-insensitive legacyId match
  h = await Hackathon.findOne({
    legacyId: { $regex: new RegExp('^' + rawId + '$', 'i') },
  });
  return h;
}

function getCanonicalHackathonId(hackathonOrId) {
  if (!hackathonOrId) return null;
  const str = typeof hackathonOrId === 'string' ? hackathonOrId : (hackathonOrId.legacyId || hackathonOrId.title || hackathonOrId.id || '');
  const lower = str.toLowerCase().trim();
  for (const [key, meta] of Object.entries(HACKATHON_MAP)) {
    if (key === lower || meta.title.toLowerCase() === lower || meta.slugs.includes(lower)) {
      return key;
    }
  }
  return typeof hackathonOrId === 'string' ? hackathonOrId : (hackathonOrId.legacyId || (hackathonOrId._id ? hackathonOrId._id.toString() : ''));
}

module.exports = {
  findHackathonByIdentifier,
  getCanonicalHackathonId,
  HACKATHON_MAP,
};
