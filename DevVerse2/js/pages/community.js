/* =========================================================
   COMMUNITY FORUM
   Discussion board per community with live MongoDB backend sync.
   ========================================================= */

let dvForumCommunity = null;
let dvCurrentCommunityObj = null;

function dvCommunityInit() {
  const root = document.getElementById('community-root');
  if (!root) return;

  const paramId = dvGetQueryParam('id') || 'c1';
  let c = (typeof dvFindCommunity === 'function' ? dvFindCommunity(paramId) : null)
    || (typeof DV_COMMUNITIES !== 'undefined' ? DV_COMMUNITIES.find((x) => x.id === paramId || x.slug === paramId || x.legacyId === paramId || x._id === paramId) : null)
    || (typeof DV_COMMUNITIES !== 'undefined' ? DV_COMMUNITIES[0] : { id: paramId, name: paramId.replace(/[-_]/g, ' '), desc: '', gradient: 0, members: 5, online: 1 });

  dvForumCommunity = c.id || paramId;
  dvCurrentCommunityObj = c;
  document.title = `${c.name} — DevVerse`;

  // Render initial page with local/cached data
  dvRenderCommunityPage(c);

  // Fetch live community from Atlas backend
  if (window.DVApi && DVApi.communities && DVApi.communities.get) {
    DVApi.communities.get(paramId).then(function (res) {
      const comm = res && res.data && (res.data.community || res.data);
      if (comm) {
        c = {
          id: comm.legacyId || comm.slug || comm._id,
          legacyId: comm.legacyId,
          slug: comm.slug,
          _id: comm._id ? comm._id.toString() : '',
          name: comm.name,
          desc: comm.desc || comm.description || c.desc,
          gradient: typeof comm.gradient === 'number' ? comm.gradient : (c.gradient || 0),
          members: typeof comm.membersCount === 'number' ? comm.membersCount : (c.members || 5),
          online: typeof comm.onlineCount === 'number' ? comm.onlineCount : (c.online || 1),
        };
        dvForumCommunity = c.id;
        dvCurrentCommunityObj = c;
        document.title = `${c.name} — DevVerse`;

        if (res.data && res.data.isMember) {
          DVStore.addToSet('communities', c.id);
          if (c.slug) DVStore.addToSet('communities', c.slug);
          if (c.legacyId) DVStore.addToSet('communities', c.legacyId);
          if (c._id) DVStore.addToSet('communities', c._id);
        }

        // Update header fields live
        const titleEl = document.getElementById('community-title');
        const descEl = document.getElementById('community-desc');
        const memEl = document.getElementById('community-members-count');
        const onlEl = document.getElementById('community-online-count');
        const gradEl = document.getElementById('community-gradient-box');
        const joinBtn = document.getElementById('community-join-btn');

        if (titleEl) titleEl.textContent = c.name;
        if (descEl) descEl.textContent = c.desc;
        if (memEl) memEl.textContent = `${c.members.toLocaleString()} members`;
        if (onlEl) onlEl.textContent = c.online;
        if (gradEl && typeof DV_TECH_GRADIENTS !== 'undefined') {
          gradEl.style.background = DV_TECH_GRADIENTS[c.gradient] || DV_TECH_GRADIENTS[0];
        }

        const isJoined = DVStore.has('communities', c.id) || !!(res.data && res.data.isMember);
        if (joinBtn) {
          joinBtn.setAttribute('data-join', c.id);
          joinBtn.textContent = isJoined ? 'Joined' : 'Join';
          joinBtn.classList.toggle('btn-ghost', isJoined);
          joinBtn.classList.toggle('btn-primary', !isJoined);
        }

        // Unlock forum box if user is a member
        if (isJoined) {
          dvUnlockForumImmediately(true, c);
        }
      }
    }).catch(function () {});
  }

  // Fetch live discussions from backend
  if (window.DVApi && DVApi.communities && DVApi.communities.getDiscussions) {
    DVApi.communities.getDiscussions(paramId).then((res) => {
      const discussions = (res && res.data && (res.data.discussions || res.data)) || [];
      if (discussions && discussions.length) {
        const mapped = discussions.map((d) => ({
          id: d._id || d.id,
          title: d.title,
          body: d.body,
          author: (d.author && (d.author.username || d.author.name)) || d.authorHandle || 'devverse',
          createdAt: new Date(d.createdAt).getTime(),
          replies: (d.replies || []).map((r) => ({
            id: r._id || r.id,
            author: (r.author && (r.author.username || r.author.name)) || r.authorHandle || 'you',
            text: r.text || r.body || '',
            createdAt: new Date(r.createdAt || Date.now()).getTime(),
          })),
        }));
        DVStore.set(`forum.${dvForumCommunity}`, mapped);
        dvRenderThreads(dvForumCommunity, DVStore.has('communities', dvForumCommunity));
      }
    }).catch(function () {});
  }
}

function dvRenderCommunityPage(c) {
  const root = document.getElementById('community-root');
  if (!root) return;

  const joined = DVStore.has('communities', c.id);
  const grad = typeof c.gradient === 'number' ? c.gradient : 0;
  const gradientBg = typeof DV_TECH_GRADIENTS !== 'undefined' ? (DV_TECH_GRADIENTS[grad] || DV_TECH_GRADIENTS[0]) : 'var(--accent)';

  root.innerHTML = `
    <div class="glass reveal in" style="padding:26px; display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between; align-items:center; margin-bottom:28px;">
      <div style="display:flex; gap:16px; align-items:center;">
        <div id="community-gradient-box" style="width:56px;height:56px;border-radius:16px;background:${gradientBg}; flex-shrink:0;"></div>
        <div>
          <h1 id="community-title" style="font-size:26px;">${c.name}</h1>
          <p id="community-desc" style="margin-top:4px; font-size:13.5px;">${c.desc || ''}</p>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        <span class="chip"><span class="mono" id="community-online-count">${c.online || 1}</span> online</span>
        <span class="mono muted" id="community-members-count" style="font-size:12.5px;">${(c.members || 5).toLocaleString()} members</span>
        <button class="btn ${joined ? 'btn-ghost' : 'btn-primary'}" data-join="${c.id}" id="community-join-btn">${joined ? 'Joined' : 'Join'}</button>
      </div>
    </div>

    <div class="glass reveal in" style="padding:6px 22px; margin-bottom:10px; display:flex; align-items:center; gap:10px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>
      <p style="font-size:12px; padding:12px 0;">Synced live with DevVerse Community Backend &amp; MongoDB Atlas.</p>
    </div>

    <div id="community-forum-box">
      ${joined ? dvThreadFormHTML() : dvLockedForumHTML(c)}
    </div>

    <div class="eyebrow">Threads</div>
    <div id="thread-list" style="display:flex; flex-direction:column; gap:14px;"></div>
  `;

  if (joined) {
    dvWireThreadForm(c.id);
  }

  dvRenderThreads(c.id, joined);
  dvReveal(root);
}

function dvThreadFormHTML() {
  return `
    <form class="glass reveal in" id="thread-form" novalidate style="padding:22px; margin-bottom:26px;">
      <h3 style="margin-bottom:14px;">Start a new thread</h3>
      <div class="field">
        <label for="thread-title">Title</label>
        <input id="thread-title" name="title" required minlength="6" data-error-required="Give your thread a title." data-error-minlength="Titles need at least 6 characters.">
      </div>
      <div class="field">
        <label for="thread-body">What do you want to discuss?</label>
        <textarea id="thread-body" name="body" rows="3" required minlength="12" data-error-required="Add a bit of context for your thread." data-error-minlength="Write at least 12 characters so people know what you're asking."></textarea>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Post thread</button>
    </form>`;
}

function dvLockedForumHTML(c) {
  const cName = c ? (c.name || 'this community') : 'this community';
  const cId = c ? (c.id || dvForumCommunity) : dvForumCommunity;
  return `
    <div class="glass reveal in forum-locked" style="padding:26px; margin-bottom:26px; text-align:center;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="margin-bottom:10px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
      <p style="font-size:13.5px; margin-bottom:14px;">Join ${cName} to start threads and reply to other builders.</p>
      <button class="btn btn-primary btn-sm" data-join="${cId}">Join community</button>
    </div>`;
}

function dvWireThreadForm(communityId) {
  const form = document.getElementById('thread-form');
  if (!form) return;
  form.onsubmit = function (e) {
    e.preventDefault();
    if (!dvValidateForm(e.target)) return;
    const titleInput = document.getElementById('thread-title');
    const bodyInput = document.getElementById('thread-body');
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const threads = dvForumThreads(communityId);
    threads.unshift({
      id: `${communityId}-${Date.now()}`,
      title,
      body,
      author: 'you',
      createdAt: Date.now(),
      replies: [],
    });
    dvForumSave(communityId, threads);
    e.target.reset();
    dvAwardPoints(DV_POINT_VALUES.thread, 'Started a discussion thread');
    dvToast(`Thread posted (+${DV_POINT_VALUES.thread} pts)`);
    dvRenderThreads(communityId, true);

    if (window.DVApi && DVApi.communities && DVApi.communities.createDiscussion) {
      DVApi.communities.createDiscussion(communityId, { title, body }).catch(function () {});
    }
  };
}

// Seamless immediate unlock called whenever Join is clicked
window.dvUnlockForumImmediately = function (active, communityObj) {
  const box = document.getElementById('community-forum-box');
  const targetComm = communityObj || dvCurrentCommunityObj || { id: dvForumCommunity };
  const commId = targetComm.id || dvForumCommunity;

  if (box) {
    if (active) {
      box.innerHTML = dvThreadFormHTML();
      dvWireThreadForm(commId);
    } else {
      box.innerHTML = dvLockedForumHTML(targetComm);
    }
  }

  // Update header button
  const topBtn = document.getElementById('community-join-btn');
  if (topBtn) {
    topBtn.textContent = active ? 'Joined' : 'Join';
    topBtn.classList.toggle('btn-ghost', active);
    topBtn.classList.toggle('btn-primary', !active);
  }

  // Update thread replies
  dvRenderThreads(commId, active);
};

function dvRenderThreads(communityId, joined) {
  const listRoot = document.getElementById('thread-list');
  if (!listRoot) return;

  const threads = dvForumThreads(communityId).slice().sort((a, b) => b.createdAt - a.createdAt);

  if (!threads.length) {
    listRoot.innerHTML = `<p class="muted">No threads yet — be the first to start one.</p>`;
    return;
  }

  listRoot.innerHTML = threads.map(function (t) {
    return `
    <div class="glass reveal in thread-card" data-thread-id="${t.id}">
      <div style="display:flex; align-items:flex-start;">
        <button class="thread-toggle" data-toggle-thread="${t.id}" style="flex:1; text-align:left; background:none; border:none; padding:18px 20px; display:flex; gap:14px; align-items:flex-start; cursor:pointer; color:inherit;">
          <img src="${dvAvatar(dvForumAuthorAvatar(t.author), 40)}" style="width:38px;height:38px;border-radius:50%; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-size:14.5px; font-weight:600;">${t.title}</div>
            <div class="mono muted" style="font-size:11.5px; margin-top:4px;">${dvForumAuthorName(t.author)} ${dvTierIconHTML(t.author)} · ${dvForumAgo(t.createdAt)}</div>
          </div>
          <span class="chip" style="flex-shrink:0;">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</span>
        </button>
        ${t.author === 'you' ? `<button class="thread-delete-btn" data-delete-thread="${t.id}" style="margin:18px 14px 0 0; flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
      </div>
      <div class="thread-body" id="thread-body-${t.id}" style="display:none; padding:16px 20px 20px 72px;">
        <p style="font-size:13.5px; margin-bottom:16px;">${t.body}</p>
        <div class="thread-replies" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
          ${t.replies.map(function (r) {
            return `
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <img src="${dvAvatar(dvForumAuthorAvatar(r.author), 30)}" style="width:28px;height:28px;border-radius:50%; flex-shrink:0;">
              <div style="flex:1;">
                <div style="font-size:12.5px;"><b>${dvForumAuthorName(r.author)}</b> ${dvTierIconHTML(r.author)} <span class="muted mono" style="font-size:11px;">${dvForumAgo(r.createdAt)}</span></div>
                <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${r.text}</div>
              </div>
              ${r.author === 'you' ? `<button class="thread-delete-btn" data-delete-reply="${t.id}" data-reply-id="${r.id}" style="flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
            </div>`;
          }).join('') || `<p class="muted" style="font-size:12.5px;">No replies yet.</p>`}
        </div>
        ${joined
          ? `<form class="reply-form" data-reply-thread="${t.id}" novalidate style="display:flex; gap:10px; align-items:flex-start;">
              <input type="text" class="reply-input" placeholder="Write a reply\u2026" required minlength="2" data-error-required="Write a reply before posting." data-error-minlength="Replies need at least 2 characters." style="flex:1;">
              <button class="btn btn-primary btn-sm" type="submit">Reply</button>
            </form>`
          : `<p class="muted" style="font-size:12.5px;">Join this community to reply.</p>`}
      </div>
    </div>`;
  }).join('');

  dvReveal(listRoot);
}

/* Delegated: expand/collapse threads + delete threads/replies */
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle-thread]');
  if (toggle) {
    const id = toggle.dataset.toggleThread;
    const body = document.getElementById(`thread-body-${id}`);
    if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }

  // Delete own thread
  const delThread = e.target.closest('[data-delete-thread]');
  if (delThread && dvForumCommunity) {
    const threadId = delThread.dataset.deleteThread;
    const threads = dvForumThreads(dvForumCommunity);
    const filtered = threads.filter(function (t) { return t.id !== threadId; });
    dvForumSave(dvForumCommunity, filtered);
    dvToast('Thread deleted');
    dvRenderThreads(dvForumCommunity, DVStore.has('communities', dvForumCommunity));
  }

  // Delete own reply
  const delReply = e.target.closest('[data-delete-reply]');
  if (delReply && dvForumCommunity) {
    const threadId = delReply.dataset.deleteReply;
    const replyId = delReply.dataset.replyId;
    const threads = dvForumThreads(dvForumCommunity);
    for (let i = 0; i < threads.length; i++) {
      if (threads[i].id === threadId) {
        threads[i].replies = threads[i].replies.filter(function (r) { return r.id !== replyId; });
        break;
      }
    }
    dvForumSave(dvForumCommunity, threads);
    dvToast('Reply deleted');
    dvRenderThreads(dvForumCommunity, DVStore.has('communities', dvForumCommunity));
    const reopened = document.getElementById(`thread-body-${threadId}`);
    if (reopened) reopened.style.display = 'block';
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.reply-form');
  if (!form || !dvForumCommunity) return;
  e.preventDefault();
  if (!DVStore.has('communities', dvForumCommunity)) return;
  if (!dvValidateForm(form)) return;
  const threadId = form.dataset.replyThread;
  const input = form.querySelector('.reply-input');
  const text = input.value.trim();
  const threads = dvForumThreads(dvForumCommunity);
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.replies.push({
    id: `${threadId}-r${Date.now()}`,
    author: 'you',
    text,
    createdAt: Date.now(),
  });
  dvForumSave(dvForumCommunity, threads);
  dvAwardPoints(DV_POINT_VALUES.reply, 'Replied to a thread');
  dvToast(`Reply posted (+${DV_POINT_VALUES.reply} pts)`);
  dvRenderThreads(dvForumCommunity, true);
  const reopened = document.getElementById(`thread-body-${threadId}`);
  if (reopened) reopened.style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => setTimeout(dvCommunityInit, 30));
