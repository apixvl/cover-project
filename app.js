let covers = [];

window.addEventListener('load', () => {
  fetch('data/covers.json')
    .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
    .then(data => { covers = data; init(); })
    .catch(err => {
      console.error('JSON load error:', err);
      document.getElementById('mainView').textContent = '❌ Failed to load cover data.';
    });
});

function init() {
  populateSidebars();
  showHome();
  setupSearchAndRandom();
  buildFilterSelectors();
}

function populateSidebars() {
  const consoles = Array.from(new Set(covers.map(c => c.console))).sort();
  document.getElementById('consoles').innerHTML =
    consoles.map(name => `<button onclick="applyFilter('console','${name}')">${name}</button>`).join('');

  const letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  document.getElementById('letters').innerHTML =
    letters.map(l => `<button onclick="applyFilter('letter','${l}')">${l}</button>`).join('');

  updateStatsAndRecent();
}

function setupSearchAndRandom() {
  document.getElementById('searchBar').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    q ? applyFilter('search', q) : showHome();
  });
  document.getElementById('btnRandom').addEventListener('click', () => {
    const rand = covers[Math.floor(Math.random() * covers.length)];
    if (rand.variants.length) showDetail(rand);
    else applyFilter('none', rand.title); // game with no variant
  });
}

function buildFilterSelectors() {
  const selC = document.getElementById('consoleFilter');
  const selL = document.getElementById('letterFilter');
  selC.innerHTML = ['All', ...Array.from(new Set(covers.map(c => c.console))).sort()]
    .map(v => `<option>${v}</option>`).join('');
  selL.innerHTML = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]
    .map(v => `<option>${v}</option>`).join('');
  selC.addEventListener('change', () => applyFilter('console', selC.value));
  selL.addEventListener('change', () => applyFilter('letter', selL.value));
}

function applyFilter(type, val) {
  showHome(false);
  if(type === 'console') {
    showGrid(covers.filter(c => c.console === val), `Console: ${val}`);
  } else if(type === 'letter') {
    showGrid(covers.filter(c => c.title.startsWith(val)), `Titles: ${val}*`);
  } else if(type === 'search') {
    applyFilter('grid', covers.filter(c => 
        c.title.toLowerCase().includes(val) ||
        c.console.toLowerCase().includes(val) ||
        c.variants.some(v => v.creator.toLowerCase().includes(val))
    ));
  } else if(type === 'none') {
    showGrid(covers.filter(c => c.title === val), `Game: ${val}`);
  } else if(type === 'grid') {
    showGrid(val, 'Results');
  }
}

function updateStatsAndRecent() {
  const s = document.getElementById('stats');
  s.innerHTML = `
    <p>Total covers: ${covers.reduce((sum, g) => sum + g.variants.length, 0)}</p>
    <p>Games: ${covers.length}</p>
    <p>Consoles: ${new Set(covers.map(c => c.console)).size}</p>`;
  
  const recent = covers.slice().sort((a,b)=> {
    const da = a.variants[0]?.date;
    const db = b.variants[0]?.date;
    return db.localeCompare(da);
  }).filter(g => g.variants.length).slice(0,5);

  document.getElementById('recentList').innerHTML = recent.map(c =>
    `<li><button onclick="showDetailByTitle('${c.title}')">${c.title}</button></li>`
  ).join('');
}

function showHome(showFilters = true) {
  document.getElementById('mainView').innerHTML = '';
  document.getElementById('filters').className = showFilters ? 'filters' : 'filters hidden';
  const recents = covers.filter(g => g.variants.length)
    .sort((a,b)=> b.variants[0].date.localeCompare(a.variants[0].date)).slice(0,10);
  showGrid(recents, 'Recently Added Covers');
}

function showGrid(list, title) {
  const main = document.getElementById('mainView');
  main.innerHTML = `<h2>${title}</h2><div class="browse-list"></div>`;

  const container = main.querySelector('.browse-list');

  // Alphabetical sort
  const sorted = list.slice().sort((a, b) => a.title.localeCompare(b.title));

  sorted.forEach(game => {
    const hasVariants = game.variants.length > 0;
    const label = hasVariants ? game.title : `${game.title} (No Covers Yet)`;

    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = () => showDetailByTitle(game.title);
    container.appendChild(btn);
  });
}

function showDetailByTitle(title) {
  const game = covers.find(g => g.title === title);
  if(!game.variants.length) { applyFilter('none', title); return; }
  showDetail(game);
}

function showDetail(game) {
  const main = document.getElementById('mainView');
  main.innerHTML = `
  <div class="cover-detail">
    <div class="variant-list">${game.variants.map((v,i)=>
      `<button data-idx="${i}">${v.name} (${v.country})</button>`).join('')}</div>
    <div>
      <img id="coverMain" src="${game.variants[0].preview}" alt="${game.title}">
      <div class="cover-info">
        <h2>${game.title}</h2>
        <p><strong>Console:</strong> ${game.console}</p>
        <p><strong>Creator:</strong> ${game.variants[0].creator}</p>
        <p><strong>Date:</strong> ${game.variants[0].date}</p>
      </div>
    </div>
  </div>`;
  
  game.variants.forEach((v,i) => {
    const btn = main.querySelector(`[data-idx="${i}"]`);
    btn.addEventListener('click', () => {
      document.getElementById('coverMain').src = v.preview;
      main.querySelector('.cover-info').innerHTML = `
        <h2>${game.title}</h2>
        <p><strong>Console:</strong> ${game.console}</p>
        <p><strong>Creator:</strong> ${v.creator}</p>
        <p><strong>Date:</strong> ${v.date}</p>`;
    });
    btn.addEventListener('mouseenter', e => showPreviewPopup(e, v.preview));
    btn.addEventListener('mouseleave', () => {
      document.getElementById('variant-preview').style.display = 'none';
    });
  });
}

function showPreviewPopup(e, src) {
  const popup = document.getElementById('variant-preview');
  popup.innerHTML = `<img src="${src}" style="max-width:200px;max-height:250px;">`;
  popup.style.top = `${e.pageY + 15}px`;
  popup.style.left = `${e.pageX + 15}px`;
  popup.style.display = 'block';
}
