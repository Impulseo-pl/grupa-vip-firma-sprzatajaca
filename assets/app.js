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

  /* ---------- mapa obszaru działania ---------- */
  var svg = document.getElementById('mapa-pl');
  if (!svg) return;

  // poziom 1 = baza, 2 = stała obsługa, 3 = realizacje na zlecenie
  var OBSZARY = {
    'malopolskie':   { lvl: 1, nazwa: 'małopolskie' },
    'slaskie':       { lvl: 2, nazwa: 'śląskie' },
    'mazowieckie':   { lvl: 2, nazwa: 'mazowieckie' },
    'dolnoslaskie':  { lvl: 2, nazwa: 'dolnośląskie' },
    'podkarpackie':  { lvl: 3, nazwa: 'podkarpackie' },
    'wielkopolskie': { lvl: 3, nazwa: 'wielkopolskie' },
    'pomorskie':     { lvl: 3, nazwa: 'pomorskie' }
  };

  // pos: gdzie względem punktu ma stanąć podpis (domyślnie nad)
  var MIASTA = [
    { n: 'Kraków',    x: 441.5, y: 586.6, woj: 'malopolskie',   duze: true, pos: 'top' },
    { n: 'Wieliczka', x: 450.6, y: 596.2, woj: 'malopolskie', pos: 'right' },
    { n: 'Skawina',   x: 432.7, y: 597.6, woj: 'malopolskie', pos: 'left' },
    { n: 'Myślenice', x: 441.0, y: 615.0, woj: 'malopolskie', pos: 'bottom' },
    { n: 'Nowy Sącz', x: 498.5, y: 641.1, woj: 'malopolskie', pos: 'bottom' },
    { n: 'Tarnów',    x: 520.4, y: 593.1, woj: 'malopolskie', pos: 'top' },
    { n: 'Katowice',  x: 371.6, y: 562.0, woj: 'slaskie',       duze: true, pos: 'left' },
    { n: 'Warszawa',  x: 522.4, y: 320.5, woj: 'mazowieckie',   duze: true, pos: 'top' },
    { n: 'Wrocław',   x: 221.1, y: 458.4, woj: 'dolnoslaskie',  duze: true, pos: 'top' },
    { n: 'Rzeszów',   x: 597.2, y: 589.5, woj: 'podkarpackie', pos: 'right' },
    { n: 'Poznań',    x: 212.5, y: 298.7, woj: 'wielkopolskie', pos: 'top' },
    { n: 'Gdańsk',    x: 343.0, y: 59.6,  woj: 'pomorskie', pos: 'top' }
  ];

  var OPIS = {
    1: 'Baza i codzienna obsługa — własne ekipy, dojazd tego samego dnia.',
    2: 'Stała obsługa obiektów na podstawie umowy, z przypisanym koordynatorem.',
    3: 'Realizacje na zlecenie — doczyszczanie, sprzątanie po remoncie, usługi jednorazowe.'
  };

  var NS = 'http://www.w3.org/2000/svg';
  var panelTytul = document.getElementById('panel-tytul');
  var panelGdzie = document.getElementById('panel-gdzie');
  var panelOpis = document.getElementById('panel-opis');
  var panelMiasta = document.getElementById('panel-miasta');
  var tip = document.getElementById('map-tip');
  var mapBox = svg.parentElement;

  /* pokoloruj województwa */
  Object.keys(OBSZARY).forEach(function (id) {
    var p = svg.querySelector('#woj-' + id);
    if (p) {
      p.classList.add('lvl-' + OBSZARY[id].lvl, 'active-area');
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      p.setAttribute('aria-label', 'Województwo ' + OBSZARY[id].nazwa);
    }
  });

  /* dorysuj pinezki miast */
  var pinsG = document.createElementNS(NS, 'g');
  pinsG.setAttribute('id', 'piny');
  MIASTA.forEach(function (m) {
    var r = m.duze ? 7 : 5;
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
  }

  function pokazWoj(id) {
    var o = OBSZARY[id];
    if (!o) return;
    czysc();
    var p = svg.querySelector('#woj-' + id);
    if (p) p.classList.add('is-sel');

    panelTytul.textContent = 'województwo ' + o.nazwa;
    panelGdzie.textContent = o.lvl === 1 ? 'Obszar podstawowy' : (o.lvl === 2 ? 'Stała obsługa' : 'Realizacje na zlecenie');
    panelOpis.textContent = OPIS[o.lvl];

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
    panelGdzie.textContent = 'województwo ' + OBSZARY[m.woj].nazwa;
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
    if (path) tipPokaz(path, OBSZARY[path.id.replace('woj-', '')].nazwa);
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
