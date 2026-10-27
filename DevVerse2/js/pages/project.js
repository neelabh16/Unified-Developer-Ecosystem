/* =========================================================
   PROJECT DETAILS
   ========================================================= */

function dvOpenImageLightbox(imgSrc) {
  let modal = document.getElementById('dv-image-lightbox');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dv-image-lightbox';
    modal.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; opacity:0; transition:opacity 0.25s ease; cursor:zoom-out;';
    modal.innerHTML = `
      <div style="position:relative; max-width:92vw; max-height:92vh; display:flex; align-items:center; justify-content:center;">
        <img id="dv-lightbox-img" src="" style="max-width:100%; max-height:88vh; border-radius:var(--radius-md); box-shadow:0 12px 48px rgba(0,0,0,0.7); object-fit:contain; border:1px solid rgba(255,255,255,0.1);">
        <button id="dv-lightbox-close" style="position:absolute; top:-36px; right:0; background:none; border:none; color:#fff; font-size:30px; cursor:pointer; line-height:1;" aria-label="Close">&times;</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target.id !== 'dv-lightbox-img') {
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 250);
      }
    });
  }

  document.getElementById('dv-lightbox-img').src = imgSrc;
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
}

function dvRenderProjectGallery(p) {
  const container = document.getElementById('project-gallery-container');
  if (!container) return;

  const images = Array.isArray(p.images) ? p.images : [];
  const currentAccount = dvAuthAccount();
  const authorHandle = (p.authorObj && (p.authorObj.username || p.authorObj.name)) || p.authorHandle || p.author;
  const isOwn = p.author === 'you' || (currentAccount && (authorHandle === currentAccount.username || (p.authorObj && (p.authorObj._id === currentAccount.id || p.authorObj === currentAccount.id))));
  const gradientIdx = typeof p.gradient === 'number' && !isNaN(p.gradient) ? p.gradient % 5 : 0;

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div class="eyebrow" style="margin-bottom:0;">Gallery</div>
      ${isOwn ? `
        <div>
          <button class="btn btn-ghost btn-sm" id="gallery-upload-btn" type="button" style="padding:4px 12px; font-size:12.5px; display:inline-flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Upload photos</span>
          </button>
          <input type="file" id="gallery-file-input" accept="image/png,image/jpeg,image/webp,image/gif" multiple style="display:none;">
        </div>
      ` : ''}
    </div>
  `;

  if (images.length > 0) {
    html += `<div class="grid grid-3" id="gallery-grid">`;
    images.forEach((imgUrl, idx) => {
      const fullSrc = dvResolveImageUrl(imgUrl);
      html += `
        <div class="glass gallery-thumb-card" style="height:150px; border-radius:var(--radius-md); overflow:hidden; position:relative; cursor:pointer;" data-preview-img="${fullSrc}">
          <img src="${fullSrc}" alt="${p.title} screenshot" style="width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.3s ease;">
          ${isOwn ? `
            <button class="btn btn-ghost btn-sm gallery-delete-btn" data-img-idx="${idx}" type="button" style="position:absolute; top:8px; right:8px; background:rgba(7,8,12,0.85); color:#ff5c5c; padding:4px 7px; border-radius:6px; z-index:3;" title="Delete screenshot">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          ` : ''}
        </div>
      `;
    });
    if (isOwn) {
      html += `
        <div class="glass gallery-upload-tile" id="gallery-add-tile" style="height:150px; border-radius:var(--radius-md); border:2px dashed var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer; color:var(--text-tertiary); transition:var(--transition);" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-tertiary)'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span style="font-size:12.5px; font-weight:500;">Add screenshot</span>
        </div>
      `;
    }
    html += `</div>`;
  } else {
    if (isOwn) {
      html += `
        <div class="glass gallery-dropzone" id="gallery-dropzone-box" style="padding:32px 20px; border-radius:var(--radius-md); border:2px dashed var(--border); text-align:center; cursor:pointer; transition:var(--transition);" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="margin:0 auto 10px; display:block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div style="font-size:14px; font-weight:600; margin-bottom:4px;">Upload screenshots & photos</div>
          <div class="muted" style="font-size:12.5px;">Click to browse or drop project screenshots here (PNG, JPG, WebP up to 10MB)</div>
        </div>
      `;
    } else {
      html += `
        <div class="grid grid-3">
          ${[0, 1, 2].map(function (i) { return '<div class="glass" style="height:140px; border-radius:var(--radius-md); background:' + DV_TECH_GRADIENTS[(gradientIdx + i) % 5] + '; opacity:' + (0.85 - i * 0.1) + ';"></div>'; }).join('')}
        </div>
      `;
    }
  }

  container.innerHTML = html;

  if (isOwn) {
    const fileInput = document.getElementById('gallery-file-input');
    const uploadBtn = document.getElementById('gallery-upload-btn');
    const addTile = document.getElementById('gallery-add-tile');
    const dropzoneBox = document.getElementById('gallery-dropzone-box');

    const triggerUpload = () => { if (fileInput) fileInput.click(); };
    if (uploadBtn) uploadBtn.addEventListener('click', triggerUpload);
    if (addTile) addTile.addEventListener('click', triggerUpload);
    if (dropzoneBox) dropzoneBox.addEventListener('click', triggerUpload);

    const dropTarget = dropzoneBox || container;
    if (dropTarget) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropTarget.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropTarget.style.borderColor = 'var(--accent)';
        });
      });
      ['dragleave', 'drop'].forEach((eventName) => {
        dropTarget.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropTarget.style.borderColor = 'var(--border)';
        });
      });
      dropTarget.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt && dt.files;
        if (files && files.length) {
          dvHandleGalleryUpload(p, files);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          dvHandleGalleryUpload(p, e.target.files);
        }
      });
    }

    container.querySelectorAll('.gallery-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.imgIdx, 10);
        if (!isNaN(idx) && idx >= 0 && idx < p.images.length) {
          p.images.splice(idx, 1);
          dvSaveProjectGallery(p);
          dvRenderProjectGallery(p);
          dvToast('Photo removed from gallery');
        }
      });
    });
  }

  container.querySelectorAll('[data-preview-img]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-delete-btn')) return;
      dvOpenImageLightbox(card.dataset.previewImg);
    });
  });
}

async function dvHandleGalleryUpload(p, files) {
  if (!files || !files.length) return;
  if (!Array.isArray(p.images)) p.images = [];

  dvToast('Uploading photos\u2026');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    let uploaded = false;
    try {
      if (window.DVApi && DVApi.uploads && DVApi.uploads.image) {
        const res = await DVApi.uploads.image(file);
        if (res && res.data && res.data.url) {
          p.images.push(res.data.url);
          uploaded = true;
        }
      }
    } catch (apiErr) {
      console.warn('API upload error, using local data URL fallback:', apiErr);
    }

    if (!uploaded) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      p.images.push(dataUrl);
    }
  }

  dvSaveProjectGallery(p);
  dvRenderProjectGallery(p);
  dvToast('Photos added to gallery');
}

function dvSaveProjectGallery(p) {
  dvUpdateUserProject(p.id, { images: p.images });
  if (p._id && p._id !== p.id) {
    dvUpdateUserProject(p._id, { images: p.images });
  }
  if (window.DVApi && DVApi.projects && DVApi.projects.update) {
    DVApi.projects.update(p.id, { images: p.images }).catch(function () {});
  }
}

function dvRenderProjectDetail(p, root) {
  if (!root || !p) return;

  const currentAccount = dvAuthAccount();
  const authorHandle = (p.authorObj && (p.authorObj.username || p.authorObj.name)) || p.authorHandle || p.author;
  const isOwn = p.author === 'you' || (currentAccount && (authorHandle === currentAccount.username || (p.authorObj && (p.authorObj._id === currentAccount.id || p.authorObj === currentAccount.id))));
  const isUserProject = (p.id && String(p.id).indexOf('user-') === 0) || Boolean(p._id) || isOwn;

  p.images = Array.isArray(p.images) ? p.images : [];

  const authorInfo = dvProjectAuthorInfo(p.author, p.authorObj);
  const authorName = authorInfo.name;
  const authorAvatarSeed = authorInfo.avatarSeed;
  const liked = DVStore.has('likes', p.id);
  const bookmarked = DVStore.has('bookmarks', p.id);

  // Track project view
  dvTrackProjectView(p.id);

  // Resolve profile link
  const profileHref = isOwn ? 'profile.html' : 'profile.html?u=' + encodeURIComponent(authorHandle || p.author);
  const displayHandle = isOwn ? dvSelfHandle() : (authorHandle || p.author);

  document.title = `${p.title} — DevVerse`;

  // Features
  const defaultFeatures = ['Realtime sync engine', 'Offline-first caching', 'Zero-config setup', 'Accessible by default'];
  const features = (p.features && p.features.length) ? p.features : (isUserProject ? [] : defaultFeatures);

  // Timeline
  const defaultTimeline = [
    { label: 'v1.0 released', when: '6 months ago' },
    { label: 'Core rewrite in ' + ((p.tags && p.tags[0]) || 'TypeScript'), when: '3 months ago' },
    { label: '1,000+ stars milestone', when: '3 weeks ago' },
  ];
  const timeline = (p.timeline && p.timeline.length) ? p.timeline : (isUserProject ? [] : defaultTimeline);

  let featuresHTML = '';
  if (features.length) {
    featuresHTML = `
        <section class="reveal in">
          <div class="eyebrow">Features</div>
          <div class="grid grid-2">
            ${features.map(function (f) { return `
              <div class="glass" style="padding:16px; display:flex; gap:10px; align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0;"><path d="M20 6L9 17l-5-5"/></svg>
                <span style="font-size:13.5px;">${f}</span>
              </div>`; }).join('')}
          </div>
        </section>`;
  }

  let timelineHTML = '';
  if (timeline.length) {
    timelineHTML = `
        <section class="reveal in">
          <div class="eyebrow">Timeline</div>
          <div class="glass" style="padding:22px;">
            ${timeline.map(function (t) { return `
              <div style="display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--border);"><span style="font-size:13.5px;">${t.label}</span><span class="mono" style="font-size:12px; color:var(--text-tertiary);">${t.when}</span></div>`; }).join('')}
          </div>
        </section>`;
  }

  const overviewExtra = isUserProject ? '' : ` This build focuses on real-world performance under load, a clean developer experience, and interface details most teams skip. It's actively maintained by ${authorName} and open for contributions.`;
  const gradientIdx = typeof p.gradient === 'number' && !isNaN(p.gradient) ? p.gradient % 5 : 0;
  const tagsList = Array.isArray(p.tags) ? p.tags : [];

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:36px;">
      <div style="height:280px; background:${DV_TECH_GRADIENTS[gradientIdx]}; position:relative; display:flex; align-items:flex-end; padding:32px;">
        <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(7,8,12,0.75));"></div>
        <div style="position:relative; z-index:1;">
          <div id="category-display" style="display:flex; align-items:center; gap:8px;">
            <span class="chip" id="category-chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${p.category || 'General'}</span>
            ${isOwn ? `<button class="btn btn-ghost btn-sm" id="edit-category-btn" type="button" style="padding:4px 10px; background:rgba(7,8,12,0.5);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Edit category</button>` : ''}
          </div>
          <h1 style="margin-top:12px; font-size:clamp(30px,4.4vw,52px);">${p.title}</h1>
        </div>
      </div>
      <div style="padding:26px 32px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:20px; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${dvAvatar(authorAvatarSeed, 44)}" style="width:44px;height:44px;border-radius:50%;">
          <div>
            <div style="font-weight:600; font-size:14px;">${authorName}</div>
            <a href="${profileHref}" class="mono" style="font-size:12px; color:var(--text-tertiary);">@${displayHandle}</a>
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost dv-like ${liked ? 'liked' : ''}" data-like="${p.id}" id="detail-like-btn" aria-label="Like this project">
            ${DV_ICON_HEART}
            <span data-like-count data-base="${p.likes}">${(liked ? p.likes + 1 : p.likes).toLocaleString()}</span>
          </button>
          <button class="btn btn-ghost dv-bookmark ${bookmarked ? 'bookmarked' : ''}" data-bookmark="${p.id}" id="detail-bookmark-btn" aria-label="Bookmark this project">
            ${DV_ICON_BOOKMARK}
            <span class="dv-bookmark-label">${bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button class="btn btn-outline" data-share><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share</button>
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="btn btn-outline"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55v-2c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.08.78 2.17v3.22c0 .3.21.65.8.55A11.51 11.51 0 0023.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg> GitHub</a>` : ''}
          ${isOwn ? `<button class="btn btn-outline project-delete-btn" id="delete-project-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
        </div>
      </div>
    </div>

    <div class="detail-grid detail-grid--wide">
      <div style="display:flex; flex-direction:column; gap:36px;">
        <section class="reveal in">
          <div class="eyebrow">Overview</div>
          <p class="lede" style="max-width:none; font-size:16px;">${p.desc}${overviewExtra}</p>
        </section>

        <section class="reveal in" id="project-gallery-container"></section>

        ${featuresHTML}

        ${timelineHTML}

        <section class="reveal in" id="comments-section">
          <div class="eyebrow">Comments</div>
          <form id="comment-form" novalidate>
            <div class="field" style="margin-bottom:14px;">
              <textarea id="comment-input" name="comment" rows="3" placeholder="Share feedback on this project\u2026" required minlength="3" data-error-required="Write something before posting a comment." data-error-minlength="Comments need at least 3 characters."></textarea>
            </div>
            <button class="btn btn-primary btn-sm" type="submit">Post comment</button>
          </form>
          <div id="comment-list" style="margin-top:22px; display:flex; flex-direction:column; gap:14px;"></div>
        </section>
      </div>

      <aside class="sticky-panel" style="display:flex; flex-direction:column; gap:20px;">
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Tech stack</div>
          <div class="pc-tags">${tagsList.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('')}</div>
        </div>
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Stats</div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Difficulty</span><span style="font-size:13px; font-weight:600;">${p.difficulty || 'Intermediate'}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Views</span><span style="font-size:13px; font-weight:600;">${dvProjectViewCount(p).toLocaleString()}</span></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Likes</span><span style="font-size:13px; font-weight:600;" data-like-count-for="${p.id}" data-base="${p.likes}">${(liked ? p.likes + 1 : p.likes).toLocaleString()}</span></div>
        </div>
        <div class="glass reveal in" style="padding:20px;">
          <div class="eyebrow">Contributors</div>
          <div style="display:flex; gap:-8px;">
            ${isOwn
              ? '<img src="' + dvAvatar(authorAvatarSeed, 36) + '" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--bg-elevated);" title="' + authorName + '">'
              : DV_DEVS.slice(0, 4).map(function (d) { return '<img src="' + dvAvatar(d.avatarSeed, 36) + '" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--bg-elevated); margin-left:-10px;" title="' + d.name + '">'; }).join('')}
          </div>
        </div>
      </aside>
    </div>

    <section class="section-tight reveal in">
      <div class="section-head"><h2>Related projects</h2></div>
      <div class="grid grid-3" id="related-projects"></div>
    </section>
  `;

  // Render the interactive Gallery
  dvRenderProjectGallery(p);

  const allProjects = dvAllProjects();
  const sameCategory = allProjects.filter(function (x) { return x.category === p.category && x.id !== p.id && x._id !== p.id; });
  let related = sameCategory.slice(0, 3);
  if (related.length < 3) {
    const usedIds = [p.id, p._id];
    for (let i = 0; i < related.length; i++) { usedIds.push(related[i].id); }
    const backfill = allProjects
      .filter(function (x) { return usedIds.indexOf(x.id) === -1 && (!x._id || usedIds.indexOf(x._id) === -1); })
      .sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })
      .slice(0, 3 - related.length);
    related = related.concat(backfill);
  }
  const relatedEl = document.getElementById('related-projects');
  if (relatedEl) {
    relatedEl.innerHTML = related.map(dvProjectCardHTML).join('');
  }

  // Delete project handler
  if (isOwn) {
    const deleteBtn = document.getElementById('delete-project-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (confirm('Delete "' + p.title + '"? This cannot be undone.')) {
          dvDeleteUserProject(p.id);
          if (p._id && p._id !== p.id) {
            dvDeleteUserProject(p._id);
          }
          dvToast('Project deleted');
          setTimeout(() => {
            window.location.href = 'explore.html';
          }, 300);
        }
      });
    }
    dvWireCategoryEditor(p, allProjects);
  }

  dvRenderComments(p.id);

  if (window.DVApi && DVApi.projects && DVApi.projects.getComments) {
    DVApi.projects.getComments(p.id).then((res) => {
      const items = (res && res.data && (res.data.comments || (Array.isArray(res.data) ? res.data : []))) || [];
      if (items && items.length) {
        const mapped = items.map((c) => ({
          _id: c._id,
          author: (c.author && (c.author.username || c.author.name)) || 'you',
          text: c.text,
          time: dvTimeAgo(Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 60000)))
        }));
        DVStore.set(`comments.${p.id}`, mapped);
        dvRenderComments(p.id);
      }
    }).catch(function () {});
  }

  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      dvPostComment(p.id);
    });
  }

  const commentInput = document.getElementById('comment-input');
  if (commentInput) {
    commentInput.addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
    });
  }

  dvReveal(root);
}

function dvProjectDetailInit() {
  const root = document.getElementById('project-detail');
  if (!root) return;
  const id = dvGetQueryParam('id');
  const allProjects = dvAllProjects();

  function mapBackendProject(bp) {
    const currentAccount = dvAuthAccount();
    const authorHandle = (bp.author && (bp.author.username || bp.author.name)) || bp.authorHandle || bp.author || '';
    const isOwn = (currentAccount && (authorHandle === currentAccount.username || (bp.author && (bp.author._id === currentAccount.id || bp.author === currentAccount.id)))) || bp.author === 'you';

    return {
      id: bp.legacyId || bp._id,
      _id: bp._id,
      title: bp.title,
      desc: bp.desc || bp.tagline,
      category: bp.category || 'General',
      difficulty: bp.difficulty || 'Intermediate',
      tags: Array.isArray(bp.tags) ? bp.tags : [],
      features: Array.isArray(bp.features) ? bp.features : [],
      timeline: Array.isArray(bp.timeline) ? bp.timeline : [],
      images: Array.isArray(bp.images) ? bp.images : [],
      githubUrl: bp.githubUrl || null,
      likes: bp.likesCount || bp.likes || 0,
      views: bp.viewsCount || bp.views || 0,
      gradient: typeof bp.gradient === 'number' && !isNaN(bp.gradient) ? bp.gradient % 5 : 0,
      art: bp.art || null,
      author: isOwn ? 'you' : authorHandle,
      authorHandle: authorHandle,
      authorObj: bp.author,
    };
  }

  if (!id) {
    const fallback = allProjects[0];
    if (fallback) dvRenderProjectDetail(fallback, root);
    return;
  }

  // 1. Check local cache first for instant load
  const localProject = dvFindProjectById(id);
  if (localProject) {
    dvRenderProjectDetail(localProject, root);
  } else {
    // Show polite loading UI instead of showing wrong project
    root.innerHTML = `
      <div class="glass reveal in" style="border-radius:var(--radius-xl); padding:60px 30px; text-align:center;">
        <div class="spinner" style="margin:0 auto 16px;"></div>
        <p class="muted" style="font-size:15px;">Loading project details\u2026</p>
      </div>
    `;
    dvReveal(root);
  }

  // 2. Always fetch fresh data from backend API
  if (window.DVApi && DVApi.projects && DVApi.projects.get) {
    DVApi.projects.get(id).then(function (res) {
      const bp = (res && res.data && (res.data.project || res.data)) || null;
      if (bp && bp.title) {
        const p = mapBackendProject(bp);
        // Sync into local user projects if own
        if (p.author === 'you') {
          const userList = dvUserProjects();
          const existingIdx = userList.findIndex((x) => x.id === p.id || x._id === p._id || (p.id && x.id === p.id));
          if (existingIdx !== -1) {
            userList[existingIdx] = Object.assign({}, userList[existingIdx], p);
          } else {
            userList.unshift(p);
          }
          dvSaveUserProjects(userList);
        }
        dvRenderProjectDetail(p, root);
      }
    }).catch(function (err) {
      console.warn('Could not fetch project from API:', err);
      if (!localProject) {
        root.innerHTML = `
          <div class="glass reveal in" style="border-radius:var(--radius-xl); padding:60px 30px; text-align:center;">
            <h2 style="margin-bottom:12px;">Project Not Found</h2>
            <p class="muted" style="margin-bottom:24px;">The project you are looking for does not exist or has been removed.</p>
            <a href="explore.html" class="btn btn-primary">Browse Projects</a>
          </div>
        `;
        dvReveal(root);
      }
    });
  }
}

function dvRenderComments(projectId) {
  const listEl = document.getElementById('comment-list');
  if (!listEl) return;
  const comments = DVStore.get(`comments.${projectId}`, []);
  if (!comments.length) {
    listEl.innerHTML = `<p class="muted" style="font-size:13px;">No comments yet \u2014 be the first to share feedback.</p>`;
    return;
  }
  listEl.innerHTML = comments.map(function (c, i) { return `
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <img src="${dvAvatar(c.author, 36)}" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;">
      <div style="flex:1;">
        <div style="font-size:13px;"><b>${c.author}</b> ${dvTierIconHTML(c.author)} <span class="muted mono" style="font-size:11px;">${c.time}</span></div>
        <div style="font-size:13.5px; color:var(--text-secondary); margin-top:3px;">${c.text}</div>
      </div>
      ${c.author === 'you' ? `<button class="thread-delete-btn" data-delete-comment="${projectId}" data-comment-index="${i}" style="flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete</button>` : ''}
    </div>`; }).join('');

  // Wire comment delete buttons
  listEl.querySelectorAll('[data-delete-comment]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const pId = this.dataset.deleteComment;
      const idx = parseInt(this.dataset.commentIndex, 10);
      const cmts = DVStore.get('comments.' + pId, []);
      if (idx >= 0 && idx < cmts.length && cmts[idx].author === 'you') {
        const deletedComment = cmts[idx];
        cmts.splice(idx, 1);
        DVStore.set('comments.' + pId, cmts);
        dvRenderComments(pId);
        dvToast('Comment deleted');
        if (window.DVApi && DVApi.projects && DVApi.projects.deleteComment && deletedComment._id) {
          DVApi.projects.deleteComment(pId, deletedComment._id).catch(function () {});
        }
      }
    });
  });
}

function dvPostComment(projectId) {
  const input = document.getElementById('comment-input');
  const form = document.getElementById('comment-form');
  if (!dvValidateForm(form)) return;
  const text = input.value.trim();
  const comments = DVStore.get(`comments.${projectId}`, []);
  const newComment = { author: 'you', text, time: 'just now' };
  comments.unshift(newComment);
  DVStore.set(`comments.${projectId}`, comments);
  form.reset();
  dvRenderComments(projectId);
  dvAwardPoints(DV_POINT_VALUES.comment, 'Posted a comment');
  dvToast(`Comment posted (+${DV_POINT_VALUES.comment} pts)`);
  if (window.DVApi && DVApi.projects && DVApi.projects.addComment) {
    DVApi.projects.addComment(projectId, text).then(function (res) {
      if (res && res.data && res.data._id) {
        newComment._id = res.data._id;
        DVStore.set(`comments.${projectId}`, comments);
      }
    }).catch(function () {});
  }
}

/** Wires the "Edit category" control on your own project's detail
 *  page: click swaps the badge for a <select> of every category
 *  already in use (plus a "+ New category" option that reveals a
 *  text input), Save persists it via dvUpdateUserProject() and
 *  updates the badge and the Related projects list in place, Cancel
 *  reverts to the plain badge without saving anything. */
function dvWireCategoryEditor(p, allProjects) {
  const editBtn = document.getElementById('edit-category-btn');
  if (!editBtn) return;
  const categories = dvUniqueArray(allProjects.map(function (x) { return x.category; }));
  editBtn.addEventListener('click', function () { dvOpenCategoryEditor(p, allProjects, categories); });
}

function dvOpenCategoryEditor(p, allProjects, categories) {
  const display = document.getElementById('category-display');
  display.innerHTML = `
    <form id="category-edit-form" novalidate style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
      <select id="category-edit-select">
        ${categories.map(function (c) { return `<option value="${c}" ${c === p.category ? 'selected' : ''}>${c}</option>`; }).join('')}
        <option value="__custom__">+ New category…</option>
      </select>
      <input id="category-edit-custom" placeholder="New category name" style="display:none; width:170px;" minlength="2" data-error-required="Enter a category name." data-error-minlength="Category names need at least 2 characters.">
      <button class="btn btn-primary btn-sm" type="submit">Save</button>
      <button class="btn btn-ghost btn-sm" id="category-edit-cancel" type="button">Cancel</button>
    </form>`;

  const select = document.getElementById('category-edit-select');
  const customInput = document.getElementById('category-edit-custom');
  select.addEventListener('change', function () {
    const isCustom = select.value === '__custom__';
    customInput.style.display = isCustom ? 'inline-block' : 'none';
    customInput.required = isCustom;
    if (isCustom) customInput.focus();
  });

  document.getElementById('category-edit-cancel').addEventListener('click', function () {
    dvRestoreCategoryBadge(p, allProjects, categories);
  });

  document.getElementById('category-edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (select.value === '__custom__' && !dvValidateForm(e.target)) return;
    const chosen = select.value === '__custom__' ? customInput.value.trim() : select.value;
    if (!chosen) return;

    p.category = chosen;
    dvUpdateUserProject(p.id, { category: chosen });
    if (p._id && p._id !== p.id) {
      dvUpdateUserProject(p._id, { category: chosen });
    }
    if (categories.indexOf(chosen) === -1) categories.push(chosen);
    dvRestoreCategoryBadge(p, allProjects, categories);
    dvToast('Category updated');

    const sameCategory = allProjects.filter(function (x) { return x.category === chosen && x.id !== p.id; });
    let related = sameCategory.slice(0, 3);
    if (related.length < 3) {
      const usedIds = [p.id].concat(related.map(function (r) { return r.id; }));
      const backfill = allProjects
        .filter(function (x) { return usedIds.indexOf(x.id) === -1; })
        .sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })
        .slice(0, 3 - related.length);
      related = related.concat(backfill);
    }
    const relEl = document.getElementById('related-projects');
    if (relEl) {
      relEl.innerHTML = related.map(dvProjectCardHTML).join('');
    }
  });
}

function dvRestoreCategoryBadge(p, allProjects, categories) {
  const display = document.getElementById('category-display');
  display.innerHTML = `
    <span class="chip" id="category-chip" style="background:rgba(7,8,12,0.5); border-color:rgba(255,255,255,0.2);">${p.category}</span>
    <button class="btn btn-ghost btn-sm" id="edit-category-btn" type="button" style="padding:4px 10px; background:rgba(7,8,12,0.5);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Edit category</button>`;
  document.getElementById('edit-category-btn').addEventListener('click', function () {
    dvOpenCategoryEditor(p, allProjects, categories);
  });
}

document.addEventListener('DOMContentLoaded', function () { setTimeout(dvProjectDetailInit, 30); });
