#!/usr/bin/env python3
"""
Import treści podstron usługowych z grupavip.com.pl (WP REST API) do statycznych .html.

Treść klienta przenoszona jest 1:1 — skrypt tylko:
  - ucina powtarzalny blok stopki wklejany przez Beaver Buildera na każdej stronie,
  - wycina galerie portfolio-filter i nadmiarowe obrazki z karuzel (limit 4 na stronę),
  - usuwa metateksty, które wyciekły do treści z brudnopisu SEO (patrz SMIECI),
  - przepisuje linki wewnętrzne na nasze pliki .html,
  - pobiera obrazki i konwertuje je do WebP.

Uruchomienie:  python3 tools/import-wp.py
"""
import json, os, re, sys, urllib.request, html as ihtml
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    sys.exit('Potrzebny Pillow: pip3 install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, 'assets', 'img', 'tresc')
API = 'https://grupavip.com.pl/wp-json/wp/v2/pages?slug={}&_fields=id,slug,title,content'
UA = {'User-Agent': 'Mozilla/5.0'}

# slug -> (etykieta w menu, grupa)
USLUGI = [
    ('sprzatanie-blokow-i-osiedli',                 'Wspólnoty, bloki i osiedla'),
    ('sprzatanie-biur',                             'Biura, firmy i biurowce'),
    ('sprzatanie-hal-i-magazynow',                  'Hale i magazyny'),
    ('sprzatanie-szpitali-i-placowek-medycznych',   'Szpitale i placówki medyczne'),
    ('sprzatanie-domow-i-mieszkan-w-krakowie',      'Domy i mieszkania'),
    ('sprzatanie-po-remoncie',                      'Sprzątanie po remoncie'),
    ('sprzatanie-po-przeprowadzkach',               'Sprzątanie po przeprowadzkach'),
    ('mycie-okien-i-witryn',                        'Mycie okien i witryn'),
    ('czyszczenie-dywanow-i-wykladzin',             'Pranie dywanów i wykładzin'),
    ('pranie-tapicerki-krakow',                     'Pranie tapicerki'),
    ('dezynfekcja-i-ozonowanie-pomieszczen',        'Dezynfekcja i ozonowanie'),
    ('sprzatanie-palacow-zamkow-dworow-dziel-sztuki','Pałace, zamki i dzieła sztuki'),
    ('sprzatanie-kosciolow',                        'Sprzątanie kościołów'),
    ('uslugi-portierskie-recepcyjne-ochrona',       'Portiernia, recepcja, ochrona'),
    ('uslugi-specjalistyczne',                      'Techniczna obsługa obiektów'),
    ('pielegnacja-ogrodow',                         'Pielęgnacja ogrodów i zieleni'),
    ('zakupy-i-zaopatrzenie-biur',                  'Zaopatrzenie biur'),
    ('transport-i-przeprowadzki-krakow',            'Transport i przeprowadzki'),
    ('pomoc-domowa',                                'Pomoc domowa i pokojówki'),
    ('opieka-domowa-nad-osobami-starszymi-krakow',  'Opieka nad osobami starszymi'),
]
SLUGI = {s for s, _ in USLUGI}

# zdania, które wyciekły do treści z brudnopisu SEO — nie są tekstem dla czytelnika
SMIECI = [
    'Dzięki tym frazom możliwe jest dotarcie do szerokiej grupy odbiorców',
    'Opinie te są realistyczne, pełne szczegółów i zawierają oceny w postaci gwiazdek',
]

MAX_IMG = 4


def pobierz(url, binary=False):
    r = urllib.request.Request(url, headers=UA)
    d = urllib.request.urlopen(r, timeout=60).read()
    return d if binary else d.decode('utf-8', 'replace')


def obrazek(url):
    """Pobiera obrazek, skaluje do 1000 px i zapisuje jako WebP. Zwraca ścieżkę względną."""
    nazwa = re.sub(r'[^a-zA-Z0-9_-]', '-', url.split('/')[-1].rsplit('.', 1)[0])[:60]
    cel = os.path.join(IMGDIR, nazwa + '.webp')
    rel = 'assets/img/tresc/' + nazwa + '.webp'
    if os.path.exists(cel):
        return rel
    try:
        im = Image.open(BytesIO(pobierz(url, binary=True))).convert('RGB')
    except Exception as e:
        print('   ! obrazek pominięty:', url.split("/")[-1], e)
        return None
    if im.width > 1000:
        im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
    os.makedirs(IMGDIR, exist_ok=True)
    im.save(cel, 'WEBP', quality=80, method=6)
    return rel


def wyczysc(c):
    c = re.sub(r'(?s)<div class="portfolio-wraper.*?$', '', c)
    i = c.find('Firma sprzątająca w Krakowie')
    if i > 200:
        j = c.rfind('<div', 0, c.rfind('<', 0, i))
        c = c[:j] if j > 0 else c[:i]
    c = re.sub(r'\s+data-node="[^"]*"', '', c)
    c = re.sub(r'(?s)<!--.*?-->', '', c)
    for s in SMIECI:                                  # całe akapity z metatekstem
        c = re.sub(r'(?s)<p[^>]*>(?:(?!</p>).)*?' + re.escape(s) + r'.*?</p>', '', c)
        c = c.replace(s, '')
    c = re.sub(r'(?s)<li[^>]*>\s*</li>', '', c)       # puste punkty listy
    c = re.sub(r'(?s)<p[^>]*>(\s|&nbsp;)*</p>', '', c)
    # puste <li> otwierające zagnieżdżoną listę -> spłaszcz (artefakt buildera)
    for _ in range(5):
        c2 = re.sub(r'(?s)<li[^>]*>\s*(<ul[^>]*>)', r'\1', c)
        c2 = re.sub(r'(?s)(</ul>)\s*</li>', r'\1', c2)
        if c2 == c:
            break
        c = c2
    c = re.sub(r'(?s)<ul[^>]*>\s*(<ul[^>]*>)', r'\1', c)
    c = re.sub(r'(?s)(</ul>)\s*</ul>', r'\1', c)
    return c


def przerob(c, slug):
    """HTML z WP -> HTML w naszych klasach. Zwraca (treść, tytuł_h1, lead)."""
    # obrazki: zostaw pierwsze MAX_IMG unikalnych, resztę wyrzuć
    widziane, zostaw = [], {}
    for m in re.finditer(r'<img[^>]+>', c):
        src = re.search(r'src="([^"]+)"', m.group(0))
        if not src:
            continue
        u = src.group(1).split('?')[0]
        if u in widziane:
            continue
        widziane.append(u)
        if len(zostaw) < MAX_IMG and u.startswith('http'):
            alt = re.search(r'alt="([^"]*)"', m.group(0))
            zostaw[u] = alt.group(1) if alt else ''
    mapa = {}
    for u, alt in zostaw.items():
        rel = obrazek(u)
        if rel:
            mapa[u] = (rel, alt)

    def img_repl(m):
        src = re.search(r'src="([^"]+)"', m.group(0))
        u = src.group(1).split('?')[0] if src else ''
        if u in mapa:
            rel, alt = mapa[u]
            return f'<img src="{rel}" alt="{alt}" loading="lazy">'
        return ''
    c = re.sub(r'<img[^>]+>', img_repl, c)
    c = re.sub(r'(?s)<(figure|picture)[^>]*>\s*</\1>', '', c)

    # linki wewnętrzne -> nasze pliki
    def link(m):
        u = m.group(1)
        mm = re.match(r'https?://(?:www\.)?grupavip\.com\.pl/([a-z0-9-]+)/?$', u)
        if mm and mm.group(1) in SLUGI:
            return 'href="%s.html"' % mm.group(1)
        if mm:
            return 'href="index.html#uslugi"'
        if u.startswith('https://grupavip.com.pl'):
            return 'href="index.html"'
        return m.group(0)
    c = re.sub(r'href="([^"]+)"', link, c)

    # nagłówki: h1 idzie do hero, h4/h5/h6 spłaszczamy do h3
    h1 = re.search(r'(?s)<h1[^>]*>(.*?)</h1>', c)
    tytul = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    c = re.sub(r'(?s)<h1[^>]*>.*?</h1>', '', c, count=1)
    c = re.sub(r'<(/?)h[456][^>]*>', r'<\1h3>', c)
    c = re.sub(r'<h2[^>]*>', '<h2>', c)
    c = re.sub(r'<h3[^>]*>', '<h3>', c)
    c = re.sub(r'<p[^>]*>', '<p>', c)
    c = re.sub(r'<ul[^>]*>', '<ul class="ticks">', c)
    c = re.sub(r'<(div|span|section)[^>]*>|</(div|span|section)>', '', c)

    # pierwszy akapit jako lead do hero
    p1 = re.search(r'(?s)<p>(.*?)</p>', c)
    lead = ''
    if p1:
        lead = re.sub(r'<[^>]+>', '', p1.group(1)).strip()
        if len(lead) > 60:
            c = c.replace(p1.group(0), '', 1)
        else:
            lead = ''

    c = re.sub(r'\n{3,}', '\n\n', c).strip()
    return c, tytul, lead


NAG = """<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{tytul} — Grupa VIP</title>
<meta name="description" content="{opis}">
<link rel="icon" href="assets/img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;750&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>

<div class="demo-bar">
  <b>Demo Impulseo</b> — treść przeniesiona 1:1 z obecnej strony Grupa VIP.
</div>

<header class="site-head">
  <div class="wrap head-in">
    <a class="brand" href="index.html"><img src="assets/img/logo.png" alt="Grupa VIP" width="300" height="248"></a>
    <nav class="nav" aria-label="Główna">
      <div class="has-sub">
        <button class="sub-btn" aria-expanded="false">Usługi</button>
        <div class="sub">{submenu}</div>
      </div>
      <a href="index.html#obszar">Obszar działania</a>
      <a href="index.html#jak">Jak zaczynamy</a>
      <a href="index.html#opinie">Opinie</a>
      <a href="index.html#kontakt">Kontakt</a>
    </nav>
    <a class="btn btn-primary head-cta" href="tel:+48605211470">605 211 470</a>
    <button class="burger" aria-expanded="false" aria-controls="mnav" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
  <div class="mobile-nav wrap" id="mnav">
    {mobilne}
    <a href="index.html#obszar">Obszar działania</a>
    <a href="index.html#kontakt">Kontakt</a>
    <a class="btn btn-primary" href="tel:+48605211470">Zadzwoń: 605 211 470</a>
  </div>
</header>

<main>
<section class="page-hero">
  <div class="wrap">
    <p class="crumbs"><a href="index.html">Strona główna</a> › {etykieta}</p>
    <h1>{tytul}</h1>
    {lead}
  </div>
</section>

<section>
  <div class="wrap tresc">
{tresc}
  </div>
</section>
"""

STOPKA = """
<section class="soft" id="zapytanie">
  <div class="wrap">
    <p class="eyebrow">Wycena</p>
    <h2>Zapytaj o wycenę</h2>
    <p class="lead" style="margin-bottom:34px">Odpowiadamy w ciągu jednego dnia roboczego. Wycena jest bezpłatna i nie zobowiązuje.</p>
    <div class="form-layout">
      <form class="quote" novalidate>
        <div class="field-row">
          <div class="field"><label for="miasto">Miejscowość</label><input id="miasto" name="miasto" type="text" placeholder="np. Kraków" required></div>
          <div class="field"><label for="obiekt">Obiekt</label><input id="obiekt" name="obiekt" type="text" placeholder="np. 3 klatki po 4 piętra / biuro 240 m²" required></div>
        </div>
        <div class="field-row">
          <div class="field"><label for="tel">Telefon</label><input id="tel" name="tel" type="tel" inputmode="tel" required></div>
          <div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" required></div>
        </div>
        <div class="field"><label for="tresc">Dodatkowe informacje</label><textarea id="tresc" name="tresc" placeholder="Zakres, częstotliwość, godziny dostępu do obiektu…"></textarea></div>
        <label class="consent"><input type="checkbox" required><span>Wyrażam zgodę na kontakt w sprawie wyceny. Dane przetwarzamy zgodnie z polityką prywatności.</span></label>
        <button class="btn btn-primary btn-lg" type="submit" style="margin-top:20px">Wyślij zapytanie</button>
        <div class="form-msg" id="form-msg">To demo — formularz nie wysyła wiadomości. W wersji produkcyjnej zgłoszenie trafia na skrzynkę firmową razem z informacją, z której podstrony przyszło.</div>
      </form>
      <div class="contact-aside">
        <div class="contact-card">
          <h3>Kontakt</h3>
          <div class="row"><span class="k">Telefon</span><a href="tel:+48122002822">12 200 28 22</a></div>
          <div class="row"><span class="k">Komórka</span><a href="tel:+48605211470">605 211 470</a></div>
          <div class="row"><span class="k">E-mail</span><a href="mailto:biuro@grupavip.com.pl">biuro@grupavip.com.pl</a></div>
          <div class="row"><span class="k">Biuro</span><span>Krzyszkowice 62<br>32-445 Krzyszkowice</span></div>
        </div>
        <div class="contact-card" style="background:#fff;color:var(--ink);border:1px solid var(--line)">
          <h3 style="color:var(--ink)">Pozostałe usługi</h3>
          <ul class="sub-list">{pokrewne}</ul>
        </div>
      </div>
    </div>
  </div>
</section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <img src="assets/img/logo.png" alt="Grupa VIP" width="300" height="248">
        <p>VIP Business Solutions sp. z o.o.<br>Krzyszkowice 62, 32-445 Krzyszkowice</p>
      </div>
      <div><h4>Usługi</h4><ul>{stopka_uslugi}</ul></div>
      <div><h4>Kontakt</h4><ul>
        <li><a href="tel:+48122002822">12 200 28 22</a></li>
        <li><a href="tel:+48605211470">605 211 470</a></li>
        <li><a href="mailto:biuro@grupavip.com.pl">biuro@grupavip.com.pl</a></li>
        <li><a href="index.html#obszar">Obszar działania</a></li>
      </ul></div>
    </div>
    <div class="foot-bottom">
      <span>Demo przygotowane przez Impulseo sp. z o.o.</span>
      <span>Strona niepubliczna, wyłączona z indeksowania.</span>
    </div>
  </div>
</footer>

<script src="assets/app.js"></script>
</body>
</html>
"""


def main():
    submenu = ''.join(f'<a href="{s}.html">{e}</a>' for s, e in USLUGI)
    mobilne = ''.join(f'<a href="{s}.html">{e}</a>' for s, e in USLUGI)
    stopka_uslugi = ''.join(f'<li><a href="{s}.html">{e}</a></li>' for s, e in USLUGI[:6])

    for idx, (slug, etykieta) in enumerate(USLUGI):
        d = json.loads(pobierz(API.format(slug)))
        if not d:
            print('BRAK:', slug)
            continue
        p = d[0]
        tytul_wp = ihtml.unescape(re.sub('<[^>]+>', '', p['title']['rendered'])).strip()
        tresc, h1, lead = przerob(wyczysc(p['content']['rendered']), slug)
        tytul = h1 or tytul_wp

        pokrewne = ''.join(
            f'<li><a href="{s}.html">{e}</a></li>'
            for s, e in [USLUGI[(idx + i) % len(USLUGI)] for i in range(1, 7)]
        )
        opis = re.sub(r'\s+', ' ', lead or tytul)[:155]
        strona = NAG.format(
            tytul=ihtml.escape(tytul), opis=ihtml.escape(opis), etykieta=ihtml.escape(etykieta),
            lead=f'<p>{ihtml.escape(lead)}</p>' if lead else '',
            tresc=tresc, submenu=submenu, mobilne=mobilne,
        ) + STOPKA.format(pokrewne=pokrewne, stopka_uslugi=stopka_uslugi)

        with open(os.path.join(ROOT, slug + '.html'), 'w', encoding='utf-8') as f:
            f.write(strona)
        print(f'{slug + ".html":50s} {len(re.sub("<[^>]+>", " ", tresc).split()):5d} słów')

    print('\nGotowe. Teraz: ./bump.sh')


if __name__ == '__main__':
    main()
