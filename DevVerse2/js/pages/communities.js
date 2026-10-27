/* =========================================================
   COMMUNITIES
   ========================================================= */

function dvRenderCommunityList(communities) {
  const root = document.getElementById('communities-grid');
  if (!root) return;
  root.innerHTML = communities.map((c) => {
    const cid = c.legacyId || c.slug || c.id || c._id;
    const joined = DVStore.has('communities', cid);
    const grad = typeof c.gradient === 'number' ? c.gradient : 0;
    const members = c.membersCount || c.members || 0;
    const online = c.onlineCount || c.online || Math.max(12, Math.floor(members * 0.1));
    return `
    <div class="glass card-lift reveal" style="padding:22px; display:flex; flex-direction:column; gap:14px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="width:48px;height:48px;border-radius:14px;background:${DV_TECH_GRADIENTS[grad] || DV_TECH_GRADIENTS[0]};"></div>
        <span class="chip"><span class="mono">${online}</span> online</span>
      </div>
      <a href="community.html?id=${cid}" style="text-decoration:none;">
        <h3>${c.name}</h3>
        <p style="font-size:13.5px; margin-top:6px;">${c.desc || c.description || ''}</p>
      </a>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border);">
        <span class="mono" style="font-size:12px; color:var(--text-tertiary);">${members.toLocaleString()} members</span>
        <div style="display:flex; gap:8px;">
          <a href="community.html?id=${cid}" class="btn btn-sm btn-outline">Open forum</a>
          <button class="btn btn-sm ${joined ? 'btn-ghost' : 'btn-primary'}" data-join="${cid}">${joined ? 'Joined' : 'Join'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
  dvReveal(root);
}

function dvCommunitiesInit() {
  const root = document.getElementById('communities-grid');
  if (!root) return;

  // Immediate render from local data
  dvRenderCommunityList(DV_COMMUNITIES);

  // If backend API is available, fetch live communities from Atlas
  if (window.DVApi && DVApi.communities && DVApi.communities.list) {
    DVApi.communities.list().then(function (res) {
      const items = (res && res.data && (res.data.communities || res.data)) || null;
      if (items && items.length) {
        dvRenderCommunityList(items);
      }
    }).catch(function () {});
  }

  const discussions = document.getElementById('discussion-previews');
  if (discussions) {
    // Pull real, current threads out of every community's forum instead of
    // a separate hardcoded list, so this preview reflects what's actually
    // on the boards (including anything you've posted yourself).
    const allThreads = dvAllForumThreads();
    const latest = allThreads.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    discussions.innerHTML = latest.length
      ? latest.map((t) => `
        <a href="community.html?id=${t.communityId}" class="glass reveal" style="padding:16px 18px; display:flex; justify-content:space-between; align-items:center; gap:14px; text-decoration:none;">
          <div><div style="font-size:13.5px; font-weight:600;">${t.title}</div><div class="mono muted" style="font-size:11.5px; margin-top:3px;">${t.communityName} · ${dvForumAgo(t.createdAt)}</div></div>
          <span class="chip">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</span>
        </a>`).join('')
      : `<p class="muted">No threads yet.</p>`;
  }

  if (discussions) dvReveal(discussions);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvCommunitiesInit, 30));
