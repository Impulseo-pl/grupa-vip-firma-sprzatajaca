# Grupa VIP — demo strony (Impulseo)

Propozycja nowej strony dla **Grupa VIP** (VIP Business Solutions sp. z o.o., Krzyszkowice k. Myślenic) — firma sprzątająca, obecna witryna: grupavip.com.pl (WordPress + Astra + Beaver Builder + WooCommerce).

Podgląd: https://impulseo-pl.github.io/grupa-vip-firma-sprzatajaca/

Strona jest **wyłączona z indeksowania** (`<meta name="robots" content="noindex, nofollow">` na każdej podstronie).

## Co jest w demie

| Element | Status |
|---|---|
| Strona główna po skróceniu treści | gotowa |
| Interaktywna mapa obszaru działania | gotowa — województwa + 12 miast, klik/hover/klawiatura |
| Formularz wyceny (główna + podstrony) | gotowy wizualnie, **nie wysyła** (demo) |
| Wzór podstrony usługowej | 2 sztuki: wspólnoty, biura |
| Wersja mobilna | gotowa |

Poza zakresem dema, do zrobienia po decyzji klienta: podstrony miejscowości, przeniesienie 38 podstron usługowych i 109 wpisów blogowych, wysyłka formularza.

## Stack

Statyczny HTML/CSS/JS, bez build-stepu. Zasoby z cache-busterem `?v=md5` — po każdej zmianie w `assets/` uruchomić:

```bash
./bump.sh
```

Podgląd lokalny:

```bash
python3 -m http.server 8123
```

## Mapa

`assets/app.js` — obiekt `OBSZARY` (województwa, 3 poziomy obsługi) i tablica `MIASTA` (współrzędne w układzie viewBox mapy, `pos` ustawia stronę podpisu).

Ścieżki SVG wygenerowane z granic administracyjnych GUGiK (Państwowy Rejestr Granic, dane bez opłat), uproszczone algorytmem Douglas-Peucker do ok. 32 KB. Mapa jest wklejona inline w `index.html` — bez tego nie dałoby się stylować i klikać województw.

Żeby dodać miasto: dopisać wpis do `MIASTA`. Przeliczenie geo → viewBox:

```
x = (lon * cos(lat_środka) - minx) / (maxx - minx) * 760
y = (maxy - lat) / (maxy - miny) * 717
```

## Zdjęcia

Pobrane z obecnej strony klienta, przeskalowane i przekonwertowane do WebP (Pillow, q=82). Razem **1,4 MB** wobec ok. 9,4 MB, które dziś ciągnie sama strona główna grupavip.com.pl.

Wszystkie zdjęcia są stockowe — to zdjęcia z obecnej witryny, nie zdjęcia realizacji klienta. Do produkcji trzeba poprosić o własne.

## Czego brakuje od klienta

- Zdjęcia własnych realizacji i ekipy (dziś na stronie same stocki)
- Rok założenia, liczba obsługiwanych obiektów, wielkość zespołu — nie ma tego nigdzie na obecnej stronie, więc nie wstawiałem żadnych liczb
- Referencje wspólnot i spółdzielni, logotypy klientów instytucjonalnych
- Potwierdzenie stawek: 35 zł/godz. (wspólnoty), 4 zł/m² (domy i mieszkania) — wzięte z obecnej strony
- NIP/KRS do stopki
- Decyzja, czy sklep WooCommerce (116 produktów) ma zostać, czy znika

## Uwagi techniczne do produkcji

- Obecna strona ma w indeksie **1703 strony `/tag-produktu/...`** (doorway pod miasta) przy 38 realnych podstronach — do wyczyszczenia przy migracji, na podstawie danych z Search Console
- Obecna strona nie ma zainstalowanej żadnej analityki (brak GA4, GTM, Pixela)
- URL-e obecnej strony są czyste i słowne — da się je przenieść 1:1, bez przekierowań na podstronach usługowych
