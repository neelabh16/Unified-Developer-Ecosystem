/* =========================================================
   HACKATHONS (listing)
   ========================================================= */

function dvRenderHackathonList(hackathons) {
  const root = document.getElementById('hackathons-grid');
  if (!root) return;
  root.innerHTML = hackathons.map((h) => {
    const item = {
      id: h.legacyId || h.id || h._id,
      title: h.title,
      desc: h.desc || h.description || '',
      tags: h.tags || ['Web3'],
      end: h.end || (Date.now() + 86400000 * 7),
      prize: h.prize || (h.prizePool ? `₹${Number(h.prizePool).toLocaleString('en-IN')}` : '₹50,000'),
      participants: typeof h.participants === 'number' ? h.participants : (h.participantsCount || 0),
      devverseParticipants: h.devverseParticipants || null,
      difficulty: h.difficulty || 'All levels',
    };
    return dvHackathonCardHTML(item);
  }).join('');
  dvReveal(root);
  dvTickCountdowns();
}

function dvHackathonsInit() {
  const root = document.getElementById('hackathons-grid');
  if (!root) return;

  // Render local data immediately
  dvRenderHackathonList(DV_HACKATHONS);

  // If backend is running, fetch live hackathons from Atlas
  if (window.DVApi && DVApi.hackathons && DVApi.hackathons.list) {
    DVApi.hackathons.list().then(function (res) {
      if (res && res.data && Array.isArray(res.data.registeredIds)) {
        res.data.registeredIds.forEach((rid) => {
          DVStore.addToSet('hackathons', rid);
        });
      }
      const items = (res && res.data && (res.data.hackathons || res.data)) || null;
      if (items && items.length) {
        items.forEach((h) => {
          const isReg = res.data && res.data.registeredIds && res.data.registeredIds.some((rid) => rid.toString() === (h._id ? h._id.toString() : '') || rid.toString() === (h.id || '') || rid.toString() === (h.legacyId || ''));
          if (isReg) {
            if (h.legacyId) DVStore.addToSet('hackathons', h.legacyId);
            if (h.id) DVStore.addToSet('hackathons', h.id);
            if (h._id) DVStore.addToSet('hackathons', h._id.toString());
          }
        });
        dvRenderHackathonList(items);
      }
    }).catch(function () {});
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvHackathonsInit, 30));
