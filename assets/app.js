/* Grupa VIP — demo Impulseo */
(function () {
  'use strict';

  /* ---------- nawigacja mobilna ---------- */
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.mobile-nav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- menu rozwijane (usługi) ---------- */
  document.querySelectorAll('.has-sub').forEach(function (box) {
    var btn = box.querySelector('.sub-btn');
    var sub = box.querySelector('.sub');
    if (!btn || !sub) return;
    function zamknij() { sub.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = sub.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    box.addEventListener('mouseenter', function () {
      sub.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    });
    box.addEventListener('mouseleave', zamknij);
    document.addEventListener('click', zamknij);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
  });

  /* ---------- mapa obszaru działania ---------- */
  var svg = document.getElementById('mapa-pl');
  if (!svg) return;

  var OBSZARY = {
    'dolnoslaskie':        'dolnośląskie',
    'kujawsko-pomorskie':  'kujawsko-pomorskie',
    'lubelskie':           'lubelskie',
    'lubuskie':            'lubuskie',
    'lodzkie':             'łódzkie',
    'malopolskie':         'małopolskie',
    'mazowieckie':         'mazowieckie',
    'opolskie':            'opolskie',
    'podkarpackie':        'podkarpackie',
    'podlaskie':           'podlaskie',
    'pomorskie':           'pomorskie',
    'slaskie':             'śląskie',
    'swietokrzyskie':      'świętokrzyskie',
    'warminsko-mazurskie': 'warmińsko-mazurskie',
    'wielkopolskie':       'wielkopolskie',
    'zachodniopomorskie':  'zachodniopomorskie'
  };

  // pos: gdzie względem punktu stoi podpis (top / bottom / left / right)
  var MIASTA = [
    { n: 'Wrocław',          x: 221.1, y: 458.4, woj: 'dolnoslaskie', duze: true, pos: 'top' },
    { n: 'Legnica',          x: 154.6, y: 446.2, woj: 'dolnoslaskie', pos: 'left' },
    { n: 'Wałbrzych',        x: 163.9, y: 499.8, woj: 'dolnoslaskie', pos: 'bottom' },
    { n: 'Bydgoszcz',        x: 294.6, y: 210.6, woj: 'kujawsko-pomorskie', duze: true, pos: 'left' },
    { n: 'Toruń',            x: 339.4, y: 224.1, woj: 'kujawsko-pomorskie', pos: 'right' },
    { n: 'Lublin',           x: 640.4, y: 441.3, woj: 'lubelskie', duze: true, pos: 'right' },
    { n: 'Zamość',           x: 692.2, y: 505.7, woj: 'lubelskie', pos: 'bottom' },
    { n: 'Zielona Góra',     x: 104.9, y: 356.6, woj: 'lubuskie', duze: true, pos: 'bottom' },
    { n: 'Gorzów Wlkp.',     x: 83.9,  y: 258.1, woj: 'lubuskie', pos: 'top' },
    { n: 'Łódź',             x: 404.4, y: 378.3, woj: 'lodzkie', duze: true, pos: 'left' },
    { n: 'Piotrków Tryb.',   x: 423.1, y: 421.8, woj: 'lodzkie', pos: 'bottom' },
    { n: 'Kraków',           x: 441.5, y: 586.6, woj: 'malopolskie', duze: true, pos: 'left' },
    { n: 'Tarnów',           x: 520.4, y: 593.1, woj: 'malopolskie', pos: 'top' },
    { n: 'Nowy Sącz',        x: 498.5, y: 641.1, woj: 'malopolskie', pos: 'bottom' },
    { n: 'Warszawa',         x: 522.4, y: 320.5, woj: 'mazowieckie', duze: true, pos: 'top' },
    { n: 'Radom',            x: 532.6, y: 422.1, woj: 'mazowieckie', pos: 'right' },
    { n: 'Płock',            x: 423.4, y: 281.5, woj: 'mazowieckie', pos: 'left' },
    { n: 'Opole',            x: 288.0, y: 511.6, woj: 'opolskie', duze: true, pos: 'left' },
    { n: 'Kędzierzyn-Koźle', x: 311.1, y: 551.6, woj: 'opolskie', pos: 'bottom' },
    { n: 'Rzeszów',          x: 597.2, y: 589.5, woj: 'podkarpackie', duze: true, pos: 'right' },
    { n: 'Przemyśl',         x: 655.5, y: 621.2, woj: 'podkarpackie', pos: 'bottom' },
    { n: 'Białystok',        x: 685.9, y: 209.5, woj: 'podlaskie', duze: true, pos: 'left' },
    { n: 'Suwałki',          x: 667.9, y: 89.1,  woj: 'podlaskie', pos: 'top' },
    { n: 'Gdańsk',           x: 343.0, y: 59.6,  woj: 'pomorskie', duze: true, pos: 'right' },
    { n: 'Słupsk',           x: 220.3, y: 45.8,  woj: 'pomorskie', pos: 'top' },
    { n: 'Katowice',         x: 371.6, y: 562.0, woj: 'slaskie', duze: true, pos: 'left' },
    { n: 'Częstochowa',      x: 378.9, y: 496.6, woj: 'slaskie', pos: 'left' },
    { n: 'Bielsko-Biała',    x: 374.2, y: 616.4, woj: 'slaskie', pos: 'bottom' },
    { n: 'Kielce',           x: 493.3, y: 488.1, woj: 'swietokrzyskie', duze: true, pos: 'left' },
    { n: 'Ostrowiec Św.',    x: 550.7, y: 480.3, woj: 'swietokrzyskie', pos: 'right' },
    { n: 'Olsztyn',          x: 482.0, y: 130.1, woj: 'warminsko-mazurskie', duze: true, pos: 'right' },
    { n: 'Elbląg',           x: 400.8, y: 84.1,  woj: 'warminsko-mazurskie', pos: 'left' },
    { n: 'Poznań',           x: 212.5, y: 298.7, woj: 'wielkopolskie', duze: true, pos: 'left' },
    { n: 'Kalisz',           x: 300.9, y: 378.1, woj: 'wielkopolskie', pos: 'bottom' },
    { n: 'Szczecin',         x: 32.6,  y: 173.1, woj: 'zachodniopomorskie', duze: true, pos: 'bottom' },
    { n: 'Koszalin',         x: 155.4, y: 78.9,  woj: 'zachodniopomorskie', pos: 'top' }
  ];

  var NS = 'http://www.w3.org/2000/svg';
  var panelTytul = document.getElementById('panel-tytul');
  var panelGdzie = document.getElementById('panel-gdzie');
  var panelMiasta = document.getElementById('panel-miasta');
  var tip = document.getElementById('map-tip');
  var mapBox = svg.parentElement;

  /* wszystkie województwa aktywne, jeden kolor */
  Object.keys(OBSZARY).forEach(function (id) {
    var p = svg.querySelector('#woj-' + id);
    if (p) {
      p.classList.add('active-area');
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      p.setAttribute('aria-label', 'Województwo ' + OBSZARY[id]);
    }
  });

  /* dorysuj pinezki miast */
  var pinsG = document.createElementNS(NS, 'g');
  pinsG.setAttribute('id', 'piny');
  MIASTA.forEach(function (m) {
    var r = m.duze ? 6 : 4;
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'pin' + (m.duze ? ' pin-duze' : ''));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', m.n);
    g.dataset.miasto = m.n;
    g.dataset.woj = m.woj;

    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', m.x);
    c.setAttribute('cy', m.y);
    c.setAttribute('r', r);
    g.appendChild(c);

    var t = document.createElementNS(NS, 'text');
    var pos = m.pos || 'top';
    var tx = m.x, ty = m.y, anchor = 'middle';
    if (pos === 'top')    { ty = m.y - r - 6; }
    if (pos === 'bottom') { ty = m.y + r + 14; }
    if (pos === 'left')   { tx = m.x - r - 5; ty = m.y + 4; anchor = 'end'; }
    if (pos === 'right')  { tx = m.x + r + 5; ty = m.y + 4; anchor = 'start'; }
    t.setAttribute('x', tx);
    t.setAttribute('y', ty);
    t.setAttribute('text-anchor', anchor);
    t.textContent = m.n;
    g.appendChild(t);

    pinsG.appendChild(g);
  });
  svg.appendChild(pinsG);

  /* panel */
  function czysc() {
    svg.querySelectorAll('.is-sel').forEach(function (el) { el.classList.remove('is-sel'); });
    svg.querySelectorAll('.w-sel').forEach(function (el) { el.classList.remove('w-sel'); });
  }

  function pokazWoj(id) {
    var nazwa = OBSZARY[id];
    if (!nazwa) return;
    czysc();
    var p = svg.querySelector('#woj-' + id);
    if (p) p.classList.add('is-sel');
    svg.querySelectorAll('.pin[data-woj="' + id + '"]').forEach(function (g) { g.classList.add('w-sel'); });

    panelTytul.textContent = 'województwo ' + nazwa;
    panelGdzie.textContent = 'Obsługiwane miejscowości';

    var lista = MIASTA.filter(function (m) { return m.woj === id; });
    panelMiasta.innerHTML = '';
    lista.forEach(function (m) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = m.n;
      b.addEventListener('click', function () { pokazMiasto(m.n); });
      li.appendChild(b);
      panelMiasta.appendChild(li);
    });
  }

  function pokazMiasto(nazwa) {
    var m = MIASTA.filter(function (x) { return x.n === nazwa; })[0];
    if (!m) return;
    pokazWoj(m.woj);
    var g = svg.querySelector('.pin[data-miasto="' + nazwa + '"]');
    if (g) g.classList.add('is-sel');
    panelTytul.textContent = m.n;
    panelGdzie.textContent = 'województwo ' + OBSZARY[m.woj];
    panelMiasta.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.textContent === nazwa ? 'true' : 'false');
    });
  }

  /* tooltip */
  function tipPokaz(el, txt) {
    if (!tip) return;
    var r = el.getBoundingClientRect();
    var br = mapBox.getBoundingClientRect();
    tip.textContent = txt;
    tip.style.left = (r.left - br.left + r.width / 2) + 'px';
    tip.style.top = (r.top - br.top) + 'px';
    tip.classList.add('show');
  }
  function tipUkryj() { if (tip) tip.classList.remove('show'); }

  svg.addEventListener('click', function (e) {
    var pin = e.target.closest('.pin');
    if (pin) { pokazMiasto(pin.dataset.miasto); return; }
    var path = e.target.closest('path.active-area');
    if (path) pokazWoj(path.id.replace('woj-', ''));
  });

  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var pin = e.target.closest('.pin');
    var path = e.target.closest('path.active-area');
    if (pin || path) {
      e.preventDefault();
      if (pin) pokazMiasto(pin.dataset.miasto);
      else pokazWoj(path.id.replace('woj-', ''));
    }
  });

  svg.addEventListener('mouseover', function (e) {
    var pin = e.target.closest('.pin');
    if (pin) return tipPokaz(pin, pin.dataset.miasto);
    var path = e.target.closest('path.active-area');
    if (path) tipPokaz(path, OBSZARY[path.id.replace('woj-', '')]);
  });
  svg.addEventListener('mouseout', tipUkryj);

  pokazWoj('malopolskie');

  /* ---------- formularz (demo) ---------- */
  var form = document.querySelector('form.quote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var msg = document.getElementById('form-msg');
      if (msg) {
        msg.classList.add('show');
        msg.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }
})();
