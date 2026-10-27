/* =========================================================
   SUBMIT PROJECT
   ========================================================= */

function dvSubmitProjectInit() {
  const root = document.getElementById('submit-project-root');
  if (!root) return;

  dvEnsureAuth().then(() => {
    if (!dvIsLoggedIn()) {
      dvToast('Sign in to submit a project');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
      return;
    }

    dvRenderSubmitProjectForm(root);
  });
}

let dvSubmittedProjectImages = [];

function dvRenderSubmitProjectForm(root) {
  const categories = dvUniqueArray(DV_PROJECTS.map((p) => p.category));
  root.innerHTML = `
    <div class="glass" style="padding:22px; margin-bottom:26px;">
      <h3 style="margin-bottom:6px;">Start from a GitHub repo (optional)</h3>
      <p style="font-size:13px; margin-bottom:16px;">Paste a public repo URL and we'll pull its name, description, and primary language from GitHub's real API to save you typing — you can still edit everything before publishing.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <input id="gh-url-input" placeholder="https://github.com/owner/repo" style="flex:1; min-width:240px;">
        <button class="btn btn-outline" id="gh-fetch-btn" type="button">Fetch details</button>
      </div>
      <div id="gh-fetch-status" class="mono" style="font-size:12px; color:var(--text-tertiary); margin-top:8px;"></div>
    </div>

    <form id="submit-project-form" class="glass" style="padding:28px; margin-bottom:40px;" novalidate>
      <div class="field">
        <label for="sp-title">Project title</label>
        <input id="sp-title" required minlength="3" maxlength="80" placeholder="e.g. Prism CLI" data-error-required="Give your project a title." data-error-minlength="Titles need at least 3 characters.">
      </div>
      <div class="field">
        <label for="sp-desc">Short description</label>
        <textarea id="sp-desc" rows="3" required minlength="20" data-error-required="Describe what it does." data-error-minlength="Give it at least 20 characters — what does it do, and why?"></textarea>
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label for="sp-category">Category</label>
          <select id="sp-category">
            ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="sp-difficulty">Difficulty</label>
          <select id="sp-difficulty">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate" selected>Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="sp-tags">Tech stack / tags</label>
        <input id="sp-tags" placeholder="React, TypeScript, Node.js" required minlength="1" data-error-required="List at least one tag — comma-separated.">
      </div>
      <div class="field">
        <label for="sp-features">Key features (comma-separated)</label>
        <input id="sp-features" placeholder="Dark mode, Offline support, Real-time sync">
      </div>
      <div class="field">
        <label for="sp-github">GitHub URL (optional)</label>
        <input id="sp-github" type="url" placeholder="https://github.com/owner/repo">
      </div>
      <div class="field">
        <label>Project screenshots / gallery photos (optional)</label>
        <div id="sp-dropzone" class="glass" style="border:2px dashed var(--border); border-radius:var(--radius-md); padding:20px; text-align:center; cursor:pointer; transition:var(--transition);" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="margin:0 auto 6px; display:block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div style="font-size:13.5px; font-weight:500;">Click or drag & drop screenshots to upload</div>
          <div class="muted" style="font-size:12px; margin-top:3px;">PNG, JPG, WebP up to 10MB</div>
          <input type="file" id="sp-file-input" accept="image/png,image/jpeg,image/webp,image/gif" multiple style="display:none;">
        </div>
        <div id="sp-preview-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:10px; margin-top:12px;"></div>
      </div>
      <button class="btn btn-primary" type="submit" style="width:100%; margin-top:6px;">Publish to Explore (+${DV_POINT_VALUES.projectSubmit} pts)</button>
    </form>

    <div class="eyebrow" style="margin-bottom:16px;">Your published projects</div>
    <div id="my-published-projects"></div>
  `;

  document.getElementById('gh-fetch-btn').addEventListener('click', dvFetchGithubForSubmit);
  document.getElementById('submit-project-form').addEventListener('submit', dvHandleProjectSubmit);
  dvWireSubmitProjectImages();
  dvRenderMyPublishedProjects();
  dvReveal(root);
}

function dvWireSubmitProjectImages() {
  const dropzone = document.getElementById('sp-dropzone');
  const fileInput = document.getElementById('sp-file-input');
  const previewGrid = document.getElementById('sp-preview-grid');
  dvSubmittedProjectImages = [];

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--accent)';
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--border)';
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt && dt.files;
    if (files && files.length) handleFiles(files);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) handleFiles(e.target.files);
  });

  async function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      let uploaded = false;
      try {
        if (window.DVApi && DVApi.uploads && DVApi.uploads.image) {
          const res = await DVApi.uploads.image(file);
          if (res && res.data && res.data.url) {
            dvSubmittedProjectImages.push(res.data.url);
            uploaded = true;
            renderPreviews();
          }
        }
      } catch (err) {}
      if (!uploaded) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
        dvSubmittedProjectImages.push(dataUrl);
        renderPreviews();
      }
    }
  }

  function renderPreviews() {
    if (!previewGrid) return;
    if (!dvSubmittedProjectImages.length) {
      previewGrid.innerHTML = '';
      return;
    }
    previewGrid.innerHTML = dvSubmittedProjectImages.map((src, idx) => `
      <div style="position:relative; height:85px; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--border);">
        <img src="${dvResolveImageUrl(src)}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" data-remove-sp-img="${idx}" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.85); color:#ff5c5c; border:none; border-radius:4px; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; line-height:1;">&times;</button>
      </div>
    `).join('');

    previewGrid.querySelectorAll('[data-remove-sp-img]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.removeSpImg, 10);
        dvSubmittedProjectImages.splice(idx, 1);
        renderPreviews();
      });
    });
  }
}

let dvGithubTimeline = [];

function dvFetchGithubForSubmit() {
  const urlInput = document.getElementById('gh-url-input');
  const status = document.getElementById('gh-fetch-status');
  const parsed = dvParseGithubRepoUrl(urlInput.value);
  if (!parsed) {
    status.textContent = 'That doesn\u2019t look like a GitHub repo URL \u2014 try https://github.com/owner/repo, or just fill the form in by hand.';
    return;
  }
  status.textContent = 'Fetching from GitHub\u2026';
  dvGithubTimeline = [];

  // Use backend proxy endpoint (which bypasses GitHub unauthenticated IP rate limits)
  if (window.DVApi && DVApi.github && DVApi.github.getRepo) {
    DVApi.github.getRepo(parsed.owner, parsed.repo)
      .then(function (res) {
        if (!res || !res.data) throw new Error('not found');
        const repo = res.data;
        document.getElementById('sp-title').value = repo.name || parsed.repo;
        document.getElementById('sp-desc').value = repo.description || '';
        document.getElementById('sp-tags').value = repo.language || 'Code';
        document.getElementById('sp-github').value = repo.html_url || urlInput.value.trim();
        dvGithubTimeline = repo.timeline || [];

        status.textContent = `Pulled ${repo.full_name} \u2014 ${dvGithubTimeline.length} recent commits for timeline. Review the fields below before publishing.`;
      })
      .catch(function () {
        fetchDirectGithub(parsed, urlInput, status);
      });
  } else {
    fetchDirectGithub(parsed, urlInput, status);
  }
}

function fetchDirectGithub(parsed, urlInput, status) {
  fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
    .then(function (res) {
      if (!res.ok) throw new Error('not found or private');
      return res.json();
    })
    .then(function (repo) {
      document.getElementById('sp-title').value = repo.name || parsed.repo;
      document.getElementById('sp-desc').value = repo.description || '';
      document.getElementById('sp-tags').value = repo.language || '';
      document.getElementById('sp-github').value = repo.html_url || urlInput.value.trim();
      status.textContent = `Pulled ${repo.full_name} \u2014 ${repo.stargazers_count.toLocaleString()} stars. Fetching recent commits\u2026`;

      return fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=5`);
    })
    .then(function (res) {
      if (!res.ok) throw new Error('commits fetch failed');
      return res.json();
    })
    .then(function (commits) {
      dvGithubTimeline = [];
      for (let i = 0; i < commits.length; i++) {
        const c = commits[i];
        const msg = c.commit.message.split('\n')[0];
        const date = c.commit.author.date;
        const msAgo = Date.now() - new Date(date).getTime();
        const daysAgo = Math.floor(msAgo / 86400000);
        let when = 'just now';
        if (daysAgo > 365) { when = Math.floor(daysAgo / 365) + ' year' + (Math.floor(daysAgo / 365) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 30) { when = Math.floor(daysAgo / 30) + ' month' + (Math.floor(daysAgo / 30) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 7) { when = Math.floor(daysAgo / 7) + ' week' + (Math.floor(daysAgo / 7) > 1 ? 's' : '') + ' ago'; }
        else if (daysAgo > 0) { when = daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago'; }
        dvGithubTimeline.push({ label: msg, when: when });
      }
      const prev = status.textContent.split('.')[0];
      status.textContent = prev + '. Pulled ' + commits.length + ' recent commits for timeline. Review the fields below before publishing.';
    })
    .catch(function () {
      status.textContent = 'Couldn\u2019t fetch that repo (private, renamed, or GitHub rate-limited us) \u2014 no problem, just fill in the fields below by hand.';
    });
}

async function dvHandleProjectSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!dvValidateForm(form)) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const tagsRaw = document.getElementById('sp-tags').value;
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

  const featuresRaw = document.getElementById('sp-features').value;
  const features = featuresRaw.split(',').map((f) => f.trim()).filter(Boolean);

  const payload = {
    title: document.getElementById('sp-title').value.trim(),
    desc: document.getElementById('sp-desc').value.trim(),
    category: document.getElementById('sp-category').value,
    difficulty: document.getElementById('sp-difficulty').value,
    tags,
    features,
    timeline: dvGithubTimeline,
    images: dvSubmittedProjectImages,
    githubUrl: document.getElementById('sp-github').value.trim() || null,
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing…';
    }

    const res = await DVApi.projects.create(payload);
    const created = res.data.project;

    // Keep client store updated
    dvAddUserProject({
      ...payload,
      id: created._id,
      images: created.images || dvSubmittedProjectImages,
    });

    dvToast(`Published "${created.title}" (+${DV_POINT_VALUES.projectSubmit} pts)`);
    setTimeout(() => {
      window.location.href = `project.html?id=${created._id}`;
    }, 400);
  } catch (err) {
    dvToast(err.message || 'Error submitting project');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = `Publish to Explore (+${DV_POINT_VALUES.projectSubmit} pts)`;
    }
  }
}

function dvRenderMyPublishedProjects() {
  const root = document.getElementById('my-published-projects');
  if (!root) return;
  const mine = dvUserProjects();
  root.innerHTML = mine.length
    ? `<div class="grid grid-3">${mine.map(dvProjectCardHTML).join('')}</div>`
    : `<p class="muted">Nothing published yet — the form above is where it starts.</p>`;
  dvReveal(root);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSubmitProjectInit, 30));
