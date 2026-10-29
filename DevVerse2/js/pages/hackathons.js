/* =========================================================
   HACKATHONS (listing)
   ========================================================= */

let currentHackathonsList = DV_HACKATHONS;
let currentFilter = 'all';

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

function dvUpdateHackathonsView() {
  const root = document.getElementById('hackathons-grid');
  if (!root) return;

  const regCountEl = document.getElementById('reg-count');
  const myRegs = typeof dvMyRegisteredHackathons === 'function' ? dvMyRegisteredHackathons() : [];
  if (regCountEl) regCountEl.textContent = myRegs.length;

  let displayList = currentHackathonsList;
  if (currentFilter === 'registered') {
    displayList = currentHackathonsList.filter((h) => {
      const hId = h.id || h.legacyId || (h._id ? String(h._id) : '');
      const legacyId = h.legacyId || h.id;
      const mongoId = h._id ? String(h._id) : '';
      return DVStore.has('hackathons', hId) ||
             (legacyId && DVStore.has('hackathons', legacyId)) ||
             (mongoId && DVStore.has('hackathons', mongoId)) ||
             (h.title && DVStore.has('hackathons', h.title.toLowerCase()));
    });
    if (!displayList.length) {
      root.innerHTML = '<p class="muted" style="grid-column: 1 / -1; padding: 32px 0;">You haven\'t registered for any hackathons yet — switch to <b>All Hackathons</b> above and click <b>Register</b> to enter a competition.</p>';
      return;
    }
  }

  dvRenderHackathonList(displayList);
}

function dvHackathonsInit() {
  const root = document.getElementById('hackathons-grid');
  if (!root) return;

  // Filter toggle button listener
  document.querySelectorAll('#hackathons-filter-toggle [data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#hackathons-filter-toggle [data-filter]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      dvUpdateHackathonsView();
    });
  });

  // Render immediately
  dvUpdateHackathonsView();

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
        currentHackathonsList = items;
        items.forEach((h) => {
          const isReg = res.data && res.data.registeredIds && res.data.registeredIds.some((rid) => rid.toString() === (h._id ? h._id.toString() : '') || rid.toString() === (h.id || '') || rid.toString() === (h.legacyId || ''));
          if (isReg) {
            if (h.legacyId) DVStore.addToSet('hackathons', h.legacyId);
            if (h.id) DVStore.addToSet('hackathons', h.id);
            if (h._id) DVStore.addToSet('hackathons', h._id.toString());
          }
        });
        dvUpdateHackathonsView();
      }
    }).catch(function () {});
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvHackathonsInit, 30));
