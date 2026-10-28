/* =========================================================
   EXPLORE PROJECTS
   ========================================================= */

let dvExploreState = { search: '', category: 'All', difficulty: 'All', sort: 'trending' };
let dvExploreApiProjects = null;

function dvIsUserProject(p) {
  if (!p) return false;
  const selfHandle = (typeof dvSelfHandle === 'function' ? dvSelfHandle() : 'you').toLowerCase();
  const account = typeof dvAuthAccount === 'function' ? dvAuthAccount() : null;
  const currentUsername = account && (account.username || account.handle) ? (account.username || account.handle).toLowerCase() : selfHandle;
  const currentName = account && account.name ? account.name.toLowerCase() : '';
  const currentId = window.DVCurrentUser && window.DVCurrentUser._id ? String(window.DVCurrentUser._id) : '';

  // 1. Check local userProjects array
  const userList = typeof dvUserProjects === 'function' ? dvUserProjects() : [];
  if (userList.some((up) => (up.id && p.id && up.id === p.id) || (up._id && p._id && up._id === p._id) || (up.title && p.title && up.title.toLowerCase().trim() === p.title.toLowerCase().trim()))) {
    return true;
  }

  // 2. Check author strings and objects
  const authorStr = typeof p.author === 'string' ? p.author.toLowerCase() : (p.author && (p.author.username || p.author.name || p.author._id) ? String(p.author.username || p.author.name || p.author._id).toLowerCase() : '');
  const authorId = p.authorId || (p.author && p.author._id ? String(p.author._id) : '');

  if (authorStr === 'you' || authorStr === 'self') return true;
  if (currentUsername && (authorStr === currentUsername || authorStr.includes(currentUsername))) return true;
  if (currentName && authorStr === currentName) return true;
  if (currentId && (authorId === currentId || authorStr === currentId)) return true;
  if (p.isOwner) return true;

  return false;
}

function dvExploreInit() {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  if (dvGetQueryParam('cat')) dvExploreState.category = dvGetQueryParam('cat');

  if (typeof dvEnsureAuth === 'function') {
    dvEnsureAuth().then(() => {
      dvRenderExploreGrid();
    });
  }

  dvRenderCategoryFilters();
  dvRenderExploreGrid();

  if (window.DVApi && DVApi.projects && DVApi.projects.list) {
    DVApi.projects.list({ limit: 100 }).then(function (res) {
      const items = (res && res.data && (res.data.projects || (Array.isArray(res.data) ? res.data : []))) || [];
      if (items && items.length) {
        dvExploreApiProjects = items.map(function (p) {
          return {
            id: p.legacyId || p.slug || p.id || p._id,
            _id: p._id ? String(p._id) : (p.id ? String(p.id) : undefined),
            legacyId: p.legacyId,
            title: p.title,
            desc: p.desc || p.tagline,
            tags: p.tags || [],
            difficulty: p.difficulty || 'Intermediate',
            category: p.category || 'General',
            likes: p.likesCount || p.likes || 0,
            views: p.viewsCount || p.views || 0,
            author: (p.author && (p.author.username || p.author.name)) || p.author || 'devverse',
            authorId: p.author && (p.author._id || p.author.id),
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
  const mySection = document.getElementById('my-projects-section');
  const myGrid = document.getElementById('my-projects-grid');
  const myCount = document.getElementById('my-projects-count');

  const source = dvExploreApiProjects || dvAllProjects();

  // Find all projects belonging to the current user
  const allUserProjects = source.filter(dvIsUserProject);
  let matchingUserProjects = allUserProjects;

  if (dvExploreState.search) {
    const q = dvExploreState.search.toLowerCase();
    matchingUserProjects = matchingUserProjects.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  if (dvExploreState.category && dvExploreState.category !== 'All') {
    matchingUserProjects = matchingUserProjects.filter((p) => p.category === dvExploreState.category);
  }

  if (dvExploreState.difficulty && dvExploreState.difficulty !== 'All') {
    matchingUserProjects = matchingUserProjects.filter((p) => p.difficulty === dvExploreState.difficulty);
  }

  switch (dvExploreState.sort) {
    case 'likes': matchingUserProjects = matchingUserProjects.sort((a, b) => b.likes - a.likes); break;
    case 'views': matchingUserProjects = matchingUserProjects.sort((a, b) => dvProjectViewCount(b) - dvProjectViewCount(a)); break;
    case 'newest': matchingUserProjects = matchingUserProjects.sort((a, b) => b.id.localeCompare(a.id)); break;
    default: matchingUserProjects = matchingUserProjects.sort((a, b) => (b.likes + dvProjectViewCount(b) / 10) - (a.likes + dvProjectViewCount(a) / 10));
  }

  // Display user projects section prominently below the search bar
  if (mySection && myGrid) {
    if (matchingUserProjects.length > 0) {
      mySection.style.display = 'block';
      if (myCount) myCount.textContent = `${matchingUserProjects.length} project${matchingUserProjects.length === 1 ? '' : 's'}`;
      myGrid.innerHTML = matchingUserProjects.map(dvProjectCardHTML).join('');
    } else {
      mySection.style.display = 'none';
    }
  }

  // Filter community projects (excluding user's projects already shown above)
  const communitySource = source.filter((p) => !dvIsUserProject(p));
  let list = communitySource.filter((p) => {
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

  const totalVisible = list.length + matchingUserProjects.length;
  count.textContent = `${list.length} community project${list.length === 1 ? '' : 's'}`;
  empty.style.display = totalVisible === 0 ? 'block' : 'none';

  grid.innerHTML = list.map(dvProjectCardHTML).join('');
  dvReveal(grid);
  if (myGrid) dvReveal(myGrid);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvExploreInit, 30));
