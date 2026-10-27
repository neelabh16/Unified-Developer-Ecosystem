/* =========================================================
   EXPLORE PROJECTS
   ========================================================= */

let dvExploreState = { search: '', category: 'All', difficulty: 'All', sort: 'trending' };
let dvExploreApiProjects = null;

function dvExploreInit() {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  if (dvGetQueryParam('cat')) dvExploreState.category = dvGetQueryParam('cat');

  dvRenderCategoryFilters();
  dvRenderExploreGrid();

  if (window.DVApi && DVApi.projects && DVApi.projects.list) {
    DVApi.projects.list({ limit: 100 }).then(function (res) {
      const items = (res && res.data && (res.data.projects || (Array.isArray(res.data) ? res.data : []))) || [];
      if (items && items.length) {
        dvExploreApiProjects = items.map(function (p) {
          return {
            id: p.legacyId || p.slug || p.id || p._id,
            title: p.title,
            desc: p.desc || p.tagline,
            tags: p.tags || [],
            difficulty: p.difficulty || 'Intermediate',
            category: p.category || 'General',
            likes: p.likesCount || p.likes || 0,
            views: p.viewsCount || p.views || 0,
            author: (p.author && (p.author.username || p.author.name)) || p.author || 'devverse',
            gradient: typeof p.gradient === 'number' ? p.gradient : 0,
            art: p.art || null,
            features: p.features || [],
            timeline: p.timeline || [],
            images: p.images || [],
            githubUrl: p.githubUrl || ''
          };
        });
        dvRenderCategoryFilters();
        dvRenderExploreGrid();
      }
    }).catch(function () {});
  }

  document.getElementById('explore-search').addEventListener('input', (e) => {
    dvExploreState.search = e.target.value.toLowerCase();
    dvRenderExploreGrid();
  });

  document.querySelectorAll('[data-difficulty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-difficulty]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      dvExploreState.difficulty = btn.dataset.difficulty;
      dvRenderExploreGrid();
    });
  });

  document.getElementById('explore-sort').addEventListener('change', (e) => {
    dvExploreState.sort = e.target.value;
    dvRenderExploreGrid();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('explore-search').focus();
    }
  });
}

function dvRenderCategoryFilters() {
  const root = document.getElementById('category-filters');
  if (!root) return;
  const source = dvExploreApiProjects || dvAllProjects();
  const cats = ['All', ...dvUniqueArray(source.map((p) => p.category))];
  root.innerHTML = cats.map((c) => `<button class="chip ${c === dvExploreState.category ? 'chip-accent' : ''}" data-cat="${c}">${c}</button>`).join('');
  root.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dvExploreState.category = btn.dataset.cat;
      dvRenderCategoryFilters();
      dvRenderExploreGrid();
    });
  });
}

function dvRenderExploreGrid() {
  const grid = document.getElementById('explore-grid');
  const empty = document.getElementById('explore-empty');
  const count = document.getElementById('explore-count');
  const source = dvExploreApiProjects || dvAllProjects();
  let list = source.filter((p) => {
    const matchSearch = !dvExploreState.search || p.title.toLowerCase().includes(dvExploreState.search) || p.desc.toLowerCase().includes(dvExploreState.search) || p.tags.some((t) => t.toLowerCase().includes(dvExploreState.search));
    const matchCat = dvExploreState.category === 'All' || p.category === dvExploreState.category;
    const matchDiff = dvExploreState.difficulty === 'All' || p.difficulty === dvExploreState.difficulty;
    return matchSearch && matchCat && matchDiff;
  });

  switch (dvExploreState.sort) {
    case 'likes': list = list.sort((a, b) => b.likes - a.likes); break;
    case 'views': list = list.sort((a, b) => dvProjectViewCount(b) - dvProjectViewCount(a)); break;
    case 'newest': list = list.sort((a, b) => b.id.localeCompare(a.id)); break;
    default: list = list.sort((a, b) => (b.likes + dvProjectViewCount(b) / 10) - (a.likes + dvProjectViewCount(a) / 10));
  }

  count.textContent = `${list.length} project${list.length === 1 ? '' : 's'}`;
  empty.style.display = list.length ? 'none' : 'block';

  const userProjects = list.filter(function (p) { return p.author === 'you'; });
  const otherProjects = list.filter(function (p) { return p.author !== 'you'; });

  if (userProjects.length > 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; margin-bottom: 4px; color: var(--text-secondary); font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Your Published Projects</div>
      ${userProjects.map(dvProjectCardHTML).join('')}
      <div style="grid-column: 1 / -1; margin-top: 16px; margin-bottom: 4px; color: var(--text-secondary); font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Community Projects</div>
      ${otherProjects.map(dvProjectCardHTML).join('')}
    `;
  } else {
    grid.innerHTML = list.map(dvProjectCardHTML).join('');
  }

  dvReveal(grid);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvExploreInit, 30));
