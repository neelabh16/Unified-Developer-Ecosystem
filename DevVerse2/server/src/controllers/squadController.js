// =============================================================================
// Squad Controller
// =============================================================================
const Squad = require('../models/Squad');
const Hackathon = require('../models/Hackathon');
const HackathonRegistration = require('../models/HackathonRegistration');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * List squads that the current user belongs to.
 * GET /api/v1/squads/mine
 */
const getMySquads = async (req, res, next) => {
  try {
    const squads = await Squad.find({ members: req.user._id })
      .populate('members', 'name username avatarSeed bio skills points')
      .populate('registeredHackathons', 'title prize difficulty end tags');

    return sendSuccess(res, 200, 'Squads retrieved', { squads });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new squad.
 * POST /api/v1/squads
 */
const createSquad = async (req, res, next) => {
  try {
    const { name, description, memberHandles = [] } = req.body;

    if (!name || !description) {
      return next(new AppError('Squad name and description are required.', 400));
    }

    const memberIds = [req.user._id];

    // Look up handles
    if (Array.isArray(memberHandles) && memberHandles.length > 0) {
      const otherUsers = await User.find({ username: { $in: memberHandles } });
      otherUsers.forEach((u) => {
        if (!memberIds.some((id) => id.toString() === u._id.toString())) {
          memberIds.push(u._id);
        }
      });
    }

    const squad = await Squad.create({
      name: name.trim(),
      description: description.trim(),
      leader: req.user._id,
      members: memberIds,
      registeredHackathons: [],
    });

    const populated = await Squad.findById(squad._id)
      .populate('members', 'name username avatarSeed bio skills points')
      .populate('registeredHackathons', 'title prize difficulty end tags');

    // Award 20 points for forming a squad
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 20 } });
    await Activity.create({
      user: req.user._id,
      amount: 20,
      reason: `Formed squad "${squad.name}"`,
      bucket: 'squadFormed',
      entityId: squad._id.toString(),
    });

    return sendSuccess(res, 201, 'Squad created successfully', { squad: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave or delete a squad.
 * DELETE /api/v1/squads/:id/leave
 */
const leaveSquad = async (req, res, next) => {
  try {
    const { id } = req.params;

    let squad = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      squad = await Squad.findById(id);
    }
    if (!squad) {
      squad = await Squad.findOne({ members: req.user._id });
    }
    if (!squad) {
      return next(new AppError('Squad not found', 404));
    }

    // Check membership
    const isMember = squad.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return next(new AppError('You are not a member of this squad.', 403));
    }

    // If leader or only member, delete squad
    if (squad.leader.toString() === req.user._id.toString() || squad.members.length <= 1) {
      await Squad.deleteOne({ _id: squad._id });
      await HackathonRegistration.deleteMany({ squad: squad._id });
      return sendSuccess(res, 200, 'Squad disbanded successfully');
    }

    // Otherwise, remove user from squad
    squad.members = squad.members.filter((m) => m.toString() !== req.user._id.toString());
    await squad.save();

    return sendSuccess(res, 200, 'Left squad successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add a member to a squad by username.
 * POST /api/v1/squads/:id/members
 */
const addSquadMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return next(new AppError('Username is required to add member.', 400));
    }

    let squad = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      squad = await Squad.findById(id);
    }
    if (!squad) {
      squad = await Squad.findOne({ members: req.user._id });
    }
    if (!squad) {
      return next(new AppError('Squad not found', 404));
    }

    // Only squad members can add other members
    const isMember = squad.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return next(new AppError('You must be a member of this squad to invite others.', 403));
    }

    const userToAdd = await User.findOne({ username: username.toLowerCase() });
    if (!userToAdd) {
      return next(new AppError(`User @${username} not found.`, 404));
    }

    if (squad.members.some((m) => m.toString() === userToAdd._id.toString())) {
      return next(new AppError(`User @${username} is already in this squad.`, 400));
    }

    squad.members.push(userToAdd._id);
    await squad.save();

    const populated = await Squad.findById(squad._id)
      .populate('members', 'name username avatarSeed bio skills points')
      .populate('registeredHackathons', 'title prize difficulty end tags');

    return sendSuccess(res, 200, `Added @${username} to squad`, { squad: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Register squad for a hackathon.
 * POST /api/v1/squads/:id/hackathons/:hackathonId
 */
const registerSquadHackathon = async (req, res, next) => {
  try {
    const { id, hackathonId } = req.params;

    let squad = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      squad = await Squad.findById(id);
    }
    if (!squad) {
      squad = await Squad.findOne({ members: req.user._id });
    }
    if (!squad) {
      return next(new AppError('Squad not found', 404));
    }

    let hackathon = null;
    if (mongoose.Types.ObjectId.isValid(hackathonId)) {
      hackathon = await Hackathon.findById(hackathonId);
    }
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ legacyId: hackathonId });
    }
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ id: hackathonId });
    }

    if (!hackathon) {
      return next(new AppError('Hackathon not found', 404));
    }

    if (squad.registeredHackathons.some((h) => h.toString() === hackathon._id.toString())) {
      return next(new AppError('Squad is already registered for this hackathon.', 400));
    }

    squad.registeredHackathons.push(hackathon._id);
    await squad.save();

    // Register all members for this hackathon
    for (const memberId of squad.members) {
      const existing = await HackathonRegistration.findOne({
        user: memberId,
        hackathon: hackathon._id,
      });
      if (!existing) {
        await HackathonRegistration.create({
          user: memberId,
          hackathon: hackathon._id,
          squad: squad._id,
        });
        await Hackathon.findByIdAndUpdate(hackathon._id, { $inc: { participantsCount: 1 } });
      }
    }

    // Award 30 points for squad registration
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 30 } });
    await Activity.create({
      user: req.user._id,
      amount: 30,
      reason: `Registered squad "${squad.name}" for "${hackathon.title}"`,
      bucket: 'squadRegister',
      entityId: `${squad._id}-${hackathon._id}`,
    });

    return sendSuccess(res, 200, `Registered squad for ${hackathon.title}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Compute squad matches for current user based on skills and preferences.
 * GET /api/v1/squads/matches
 */
const getSquadMatches = async (req, res, next) => {
  try {
    const userProfile = req.user.squadFinderProfile || { skills: [], categories: [], style: 'either' };
    const mySkills = userProfile.skills || [];
    const myCategories = userProfile.categories || [];

    // Find all other developers (excluding self)
    const candidates = await User.find({ _id: { $ne: req.user._id } })
      .select('name username avatarSeed bio skills points')
      .limit(20);

    const matches = candidates.map((dev) => {
      const devSkills = dev.skills || [];
      const shared = devSkills.filter((s) => mySkills.includes(s));
      const complement = devSkills.filter((s) => !mySkills.includes(s));

      let score = 50;
      if (userProfile.style === 'similar') {
        score += shared.length * 15;
      } else if (userProfile.style === 'complement') {
        score += complement.length * 12;
      } else {
        score += shared.length * 8 + complement.length * 8;
      }

      const matchPct = Math.min(98, Math.max(45, score));

      return {
        developer: dev,
        matchPct,
        sharedSkills: shared,
        complementarySkills: complement,
      };
    });

    matches.sort((a, b) => b.matchPct - a.matchPct);

    return sendSuccess(res, 200, 'Squad matches computed', { matches });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySquads,
  createSquad,
  leaveSquad,
  addSquadMember,
  registerSquadHackathon,
  getSquadMatches,
};
