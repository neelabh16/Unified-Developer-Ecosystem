/* =========================================================
   HACKATHON DETAILS
   ========================================================= */

let dvCurrentHackathon = null;
let dvCurrentRosterList = [];

function dvRenderDevVerseRoster(hackathonId, devList, isRegistered) {
  const container = document.getElementById('hackathon-devverse-roster');
  if (!container) return;

  const cards = [];

  if (isRegistered) {
    cards.push(`
      <div class="glass" style="padding:16px; display:flex; gap:12px; align-items:center; border:1px solid var(--accent); background:rgba(124,111,255,0.06);">
        <img src="${dvAvatar('you', 42)}" style="width:40px;height:40px;border-radius:50%;border:2px solid var(--accent);object-fit:cover;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:14px; font-weight:600; display:flex; align-items:center; gap:6px;">
            You <span class="chip chip-accent" style="font-size:10px; padding:2px 6px;">Competing</span>
          </div>
          <div class="mono muted" style="font-size:11.5px; margin-top:2px;">DevVerse Registered Builder</div>
        </div>
      </div>
    `);
  }

  const selfHandle = typeof dvSelfHandle === 'function' ? dvSelfHandle() : 'you';
  devList.forEach((item) => {
    const handle = typeof item === 'string' ? item : (item.username || item.handle);
    if (handle === 'you' || handle === selfHandle) return;

    let dev = typeof DV_DEVS !== 'undefined' ? DV_DEVS.find((d) => d.handle === handle) : null;
    const name = (typeof item === 'object' && item.name) || (dev ? dev.name : handle);
    const avatar = (typeof item === 'object' && item.avatarUrl) || dvAvatar((dev && dev.avatarSeed) || handle, 42);
    const points = (typeof item === 'object' && typeof item.points === 'number') ? item.points : (dev ? dev.points : 5000);
    const skills = (typeof item === 'object' && item.skills && item.skills.join(', ')) || (dev ? dev.skills.join(', ') : 'Builder');

    cards.push(`
      <a href="profile.html?u=${encodeURIComponent(handle)}" class="glass card-lift" style="padding:16px; display:flex; gap:12px; align-items:center; text-decoration:none;">
        <img src="${avatar}" style="width:40px;height:40px;border-radius:50%;border:1px solid var(--border);object-fit:cover;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
          <div class="mono muted" style="font-size:11.5px; margin-top:2px;">@${handle} · ${points.toLocaleString()} pts</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${skills}</div>
        </div>
      </a>
    `);
  });

  container.innerHTML = cards.join('');
  const totalCount = devList.length + (isRegistered ? 1 : 0);
  const chipEl = document.getElementById('roster-count-chip');
  if (chipEl) chipEl.textContent = totalCount;
  const detailEl = document.getElementById('detail-dv-count');
  if (detailEl) detailEl.textContent = totalCount;
}

window.dvUpdateDetailRoster = function (hackathonId, active) {
  if (!dvCurrentHackathon || dvCurrentHackathon.id !== hackathonId) return;
  dvRenderDevVerseRoster(hackathonId, dvCurrentRosterList, active);
};

function dvHackathonDetailInit() {
  const root = document.getElementById('hackathon-detail');
  if (!root) return;
  const id = dvGetQueryParam('id') || DV_HACKATHONS[0].id;
  const h = DV_HACKATHONS.find((x) => x.id === id || x.legacyId === id || (x.title && x.title.toLowerCase() === id.toLowerCase()) || (x._id && x._id.toString() === id.toString())) || DV_HACKATHONS[0];
  dvCurrentHackathon = h;

  const mySquads = typeof dvMySquads === 'function' ? dvMySquads() : [];
  const squadRegistered = mySquads.find((sq) => {
    return (sq.registeredHackathons || []).some((hid) => hid === h.id || hid === h.legacyId || (h.title && typeof hid === 'string' && hid.toLowerCase() === h.title.toLowerCase()));
  });
  const registered = DVStore.has('hackathons', h.id) || (h.legacyId && DVStore.has('hackathons', h.legacyId)) || (h._id && DVStore.has('hackathons', h._id)) || !!squadRegistered;
  const bookmarked = DVStore.has('bookmarks', 'hack-' + h.id);

  let dvList = (h.devverseParticipants && h.devverseParticipants.slice()) || [];
  dvCurrentRosterList = dvList;
  const initialCount = dvList.length + (registered ? 1 : 0);

  document.title = `${h.title} — DevVerse`;

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:36px;" data-end="${h.end}">
      <div style="height:220px; background:${DV_TECH_GRADIENTS[h.gradient]}; position:relative; display:flex; align-items:flex-end; padding:32px;">
        <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(7,8,12,0.75));"></div>
        <div style="position:relative; z-index:1;">
          <span class="chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${h.tags[0]}</span>
          <h1 style="margin-top:12px; font-size:clamp(28px,4vw,46px);">${h.title}</h1>
        </div>
      </div>
      <div style="padding:26px 32px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:20px; align-items:center;">
        <div>
          <div class="mono muted" style="font-size:11.5px; margin-bottom:6px;">Time remaining to hack</div>
          <div class="mono countdown" style="font-size:28px; font-weight:700; color:var(--accent);">--:--:--</div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-ghost dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="hack-${h.id}" aria-label="Bookmark this hackathon">
            ${DV_ICON_BOOKMARK}
            <span class="dv-bookmark-label">${bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button class="btn btn-outline" data-share><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share</button>
          <button class="btn ${registered ? 'btn-outline' : 'btn-primary'}" data-register="${h.id}">${registered ? (squadRegistered ? `Registered (${squadRegistered.name}) ✓` : 'Registered ✓') : 'Register now'}</button>
        </div>
      </div>
    </div>

    <div class="detail-grid detail-grid--wide">
      <div style="display:flex; flex-direction:column; gap:36px;">
        <section class="reveal in">
          <div class="eyebrow">Overview</div>
          <p class="lede" style="max-width:none; font-size:16px;">${h.longDesc}</p>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Tracks</div>
          <div class="pc-tags">${h.tracks.map((t) => `<span class="chip chip-accent">${t}</span>`).join('')}</div>
        </section>

        <!-- DevVerse Community Delegation Roster -->
        <section class="reveal in">
          <div class="eyebrow">DevVerse Delegation</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h3 style="font-size:18px;">Builders competing from DevVerse</h3>
            <span class="chip"><span class="mono" id="roster-count-chip">${initialCount}</span> builders</span>
          </div>
          <div id="hackathon-devverse-roster" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px;"></div>
          <div id="hackathon-devverse-squads"></div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Timeline</div>
          <div class="glass" style="padding:22px;">
            ${h.timeline.map(([label, when]) => `
              <div style="display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border);"><span style="font-size:13.5px;">${label}</span><span class="mono" style="font-size:12px; color:var(--text-tertiary);">${when}</span></div>`).join('')}
          </div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">Rules</div>
          <div class="grid grid-2">
            ${h.rules.map((r) => `
              <div class="glass" style="padding:16px; display:flex; gap:10px; align-items:flex-start;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="M20 6L9 17l-5-5"/></svg>
                <span style="font-size:13px;">${r}</span>
              </div>`).join('')}
          </div>
        </section>

        <section class="reveal in">
          <div class="eyebrow">How submissions are judged</div>
          <div class="glass" style="padding:22px; display:flex; flex-direction:column; gap:14px;">
            ${h.judging.map(([criteria, weight]) => `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>${criteria}</span><span class="mono muted">${weight}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${weight}"></div></div>
              </div>`).join('')}
          </div>
        </section>
      </div>

      <aside style="display:flex; flex-direction:column; gap:20px; position:sticky; top:110px;">
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Details</div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Prize pool</span><span style="font-size:13px; font-weight:600;">${h.prize}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Worldwide joined</span><span style="font-size:13px; font-weight:600;">🌍 ${Number(h.participants || 0).toLocaleString()} global</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">DevVerse builders</span><span style="font-size:13px; font-weight:600; color:var(--accent);"><span id="detail-dv-count">${initialCount}</span> joined</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Difficulty</span><span style="font-size:13px; font-weight:600;">${h.difficulty}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Mode</span><span style="font-size:13px; font-weight:600;">${h.mode}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Organized by</span><span style="font-size:13px; font-weight:600;">${h.organizer}</span></div>
        </div>
      </aside>
    </div>

    <section class="section-tight reveal in">
      <div class="section-head"><h2>Other hackathons</h2></div>
      <div class="grid grid-3" id="related-hackathons"></div>
    </section>
  `;

  dvRenderDevVerseRoster(h.id, dvList, registered);

  // If live backend API available, sync with database registrations
  if (window.DVApi && DVApi.hackathons && DVApi.hackathons.get) {
    DVApi.hackathons.get(h.id).then(function (res) {
      const data = res && res.data;
      if (data) {
        const isReg = typeof data.isRegistered === 'boolean' ? data.isRegistered : registered;
        if (isReg) {
          DVStore.addToSet('hackathons', h.id);
          if (h.legacyId) DVStore.addToSet('hackathons', h.legacyId);
          if (h._id) DVStore.addToSet('hackathons', h._id);
          const regBtn = document.querySelector(`[data-register="${h.id}"]`);
          if (regBtn) {
            regBtn.textContent = data.registeredSquad ? `Registered (${data.registeredSquad.name}) ✓` : 'Registered ✓';
            regBtn.classList.remove('btn-primary');
            regBtn.classList.add('btn-outline');
          }
        }
        if (data.devverseParticipants && data.devverseParticipants.length) {
          dvCurrentRosterList = data.devverseParticipants;
          dvRenderDevVerseRoster(h.id, data.devverseParticipants, isReg);
        } else if (isReg !== registered) {
          dvRenderDevVerseRoster(h.id, dvList, isReg);
        }

        // Render competing squads if present
        const squadsContainer = document.getElementById('hackathon-devverse-squads');
        if (squadsContainer && data.registeredSquads && data.registeredSquads.length > 0) {
          squadsContainer.innerHTML = `
            <div class="glass" style="padding:16px 20px; border-left:3px solid var(--accent); margin-top:16px;">
              <div class="eyebrow" style="margin-bottom:8px;">DevVerse Squads Competing</div>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${data.registeredSquads.map((sq) => `
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                      <span style="font-weight:600; font-size:14px;">${sq.name}</span>
                      ${sq.description ? `<span class="muted" style="font-size:12px; margin-left:8px;">— ${sq.description}</span>` : ''}
                    </div>
                    <span class="chip">${sq.members ? sq.members.length : 1} builders</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }
    }).catch(function () {});
  }

  document.getElementById('related-hackathons').innerHTML = DV_HACKATHONS.filter((x) => x.id !== h.id).slice(0, 3).map(dvHackathonCardHTML).join('');

  dvReveal(root);
  dvTickCountdowns();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvHackathonDetailInit, 30));
