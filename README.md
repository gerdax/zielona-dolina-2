# Zielona Dolina II · Pogranicze

**[Graj w przeglądarce](https://gerdax.github.io/zielona-dolina-2/)** · [Osada testowa](https://gerdax.github.io/zielona-dolina-2/?qa=village) · [GitHub](https://github.com/gerdax/zielona-dolina-2)

Autorska przeglądarkowa strategia 3D o osadzie, bohaterze i zjednoczeniu doliny. Nowy, niezależny projekt. Wersja **0.23.11** obejmuje pierwszy grywalny region; pełna kampania jest rozwijana etapami.

## Uruchomienie

Wymagany Node.js 22.12+ i npm. Zweryfikowano na Node.js 24.3.0.

```sh
npm ci
npm run dev
```

Otwórz adres pokazany przez Vite. Gra potrzebuje WebGL2. Zasoby i fonty są lokalne; podczas gry nie korzysta z kont, usług chmurowych ani CDN.

```sh
npm test
npm run build
npm run preview
```

Gotowa statyczna aplikacja znajduje się w `dist/`. Katalog jest generowany i nie jest wersjonowany.

## Gra

Kliknij jednostkę, a potem ziemię, aby wydać rozkaz ruchu. Przeciągnij mapę lewym przyciskiem, aby przesunąć kamerę. Kółko przybliża miejsce pod kursorem; PPM i środkowy przycisk również pozwalają przesuwać mapę. Przycisk **Zaznacz** włącza prostokąt wyboru oddziału; można też użyć Shift i przeciągnięcia. Minimapa obsługuje kliknięcie i przeciąganie. WASD i strzałki są opcjonalne.

Budowa ma 54 pozycje w pięciu kategoriach. Po wyborze budowli paleta znika; kliknij miejsce lub przeciągnij odcinek drogi, muru czy przeprawy. Most przeciągnij od jednego brzegu do drugiego: podgląd dopasuje długość i kierunek oraz pokaże łączny koszt. Puszczenie przycisku buduje całą przeprawę. Przycisk **Zakończ** albo PPM kończy stawianie. Przeciągnięcie PPM przesuwa kamerę także w trakcie budowy.

Gra działa w czasie rzeczywistym. **Nie ma pauzy taktycznej**: menu, paleta budowy, wczytanie starego zapisu ani zmiana aktywnego okna nie zatrzymują rozgrywki. Tylko porażka kończy symulację.

Rozwiń gospodarkę, wyszkol wojsko, zabezpiecz ruiny, odbuduj strażnicę i wznieś dwór. Sojusz lub podbój sąsiada pozwala zjednoczyć region. Po zwycięstwie można grać dalej. Utrata budowli pozostawia ruiny do odbudowy; utrata bohatera wymaga wczytania zapisu.

Menu zawiera zapis, wczytanie, poprzednią kopię, eksport/import JSON oraz ustawienia grafiki i dźwięku. Autosave działa co 30 sekund. Dane zapisują się w IndexedDB danego adresu przeglądarki; zmiana portu lub przeglądarki oznacza inny magazyn. Eksport pozwala przenieść postęp.

## Architektura

- `src/simulation.ts`: serializowalny świat, kroki 0,1 s, wspólne rozkazy i nawigacja.
- `src/content.ts`: budynki, koszty i dalszy zakres.
- `src/renderer.ts`: Three.js, autorskie modele, animacje, instancjonowanie oddziałów.
- `src/main.ts`: interfejs, sterowanie myszą, cele i integracja.
- `src/save.ts`: walidacja, IndexedDB i kopia poprzedniego zapisu.
- `tests/`: pełna pętla regionu, regresje mechanik i trwałość zapisu.


## Wersjonowanie

Stosujemy SemVer: `0.MINOR.PATCH`. Nowy etap gry zwiększa MINOR; poprawki zwiększają PATCH. Zmiany formatu zapisu wymagają osobnej zmiany jego `version` i migracji, niezależnie od wersji aplikacji.

Każde wydanie: aktualizacja `CHANGELOG.md`, `npm test`, `npm run build`, kontrola w przeglądarce, następnie commit i tag `vX.Y.Z`. Pełna historia pozostaje lokalnie. Publiczne repozytorium zawiera wybrane pliki gry i konfigurację publikacji.

## Licencje zasobów

Modele powstają w kodzie tego projektu. Nie zawiera zasobów Warcrafta. Three.js: MIT. Inter i Cormorant Garamond: SIL Open Font License, kopie licencji w zainstalowanych pakietach `@fontsource/*/LICENSE`. Pozostałe zależności i ich dokładne wersje opisuje `package-lock.json`.

## Osada testowa

Przy uruchomionym serwerze deweloperskim otwórz `http://127.0.0.1:5173/?qa=village`. Osada ma gospodarkę, zapasy, klejnoty, armię, fortyfikacje i przekopy do prób. Ma osobny zapis IndexedDB oraz klucz odtwarzania sesji. Zapis ręczny, automatyczny, zakupy, import i wczytywanie w tej karcie nie korzystają z bazy kampanii. Zwykła osada pozostaje pod adresem bez parametru.

## Nowe budowle (0.20.0)

**Obrona:** brama wodna (tylko na wodzie), schody na mury i wieża sygnałowa. **Produkcja:** warsztat naprawczy. **Osada:** posterunek kupiecki. **Przeprawy:** stocznia przy brzegu.

Stocznia buduje zwykłą łódź i transportowiec dla bohatera oraz trzech dodatkowych pasażerów. Zaznacz transportowiec i użyj Zaokrętuj oddział / Wysadź oddział. Warsztat i stocznia wymagają pracownika do automatycznej naprawy.

Osada testowa jest automatycznie uzupełniana o sześć nowych budowli, obsadę usług, kupca, transportowiec i trzyosobową załogę. Uzupełnienie nie resetuje istniejącej osady ani jej zapasów i nie powiela gotowego wyposażenia przy kolejnym uruchomieniu.

## Publikacja w przeglądarce

Konfiguracja GitHub Pages znajduje się w `.github/workflows/pages.yml`. [Instrukcja publikacji](docs/github-pages.md) opisuje osobne repozytorium i uruchomienie strony. Adres publikacji: https://gerdax.github.io/zielona-dolina-2/ (status wdrożenia jest widoczny w GitHub Actions).
