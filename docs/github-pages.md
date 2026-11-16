# Publikacja na GitHub Pages

Projekt jest przygotowany dla osobnego repozytorium `gerdax/zielona-dolina-2`. Nie zastępuje starszej gry w `gerdax/zielona-dolina`.

1. Właściciel konta loguje się do GitHub i tworzy publiczne repozytorium `zielona-dolina-2`, bez początkowego README.
2. Kod gry, testy i konfigurację publikacji wysłano przez integrację GitHub. Pełna historia lokalna oraz lokalne instrukcje i dokumenty robocze nie zostały opublikowane. Nie należy wysyłać całego lokalnego drzewa ani historii bez przeglądu zawartości.

3. W repozytorium wybiera **Settings → Pages → Source → GitHub Actions**.
4. W **Actions** uruchamia lub ponawia workflow **Publish game to GitHub Pages**.
5. Po udanym wdrożeniu adres strony będzie widoczny w wyniku workflow. Oczekiwany adres: `https://gerdax.github.io/zielona-dolina-2/`.

Workflow instaluje zależności, uruchamia testy, buduje grę z właściwą ścieżką i publikuje `dist`. Następne zmiany na `main` wdrażają się automatycznie. Osada testowa jest dostępna przez dopisanie `?qa=village`.

Zapisy gry pozostają w przeglądarce gracza. Nowa domena nie odczyta lokalnych zapisów z `127.0.0.1`; można je przenieść przez Eksportuj/Importuj w menu gry.

Gra została opublikowana i uruchomiona w przeglądarce: https://gerdax.github.io/zielona-dolina-2/ . Źródło Pages jest ustawione na GitHub Actions; testy, build i wdrożenie przeszły. Bieżący status publikacji: https://github.com/gerdax/zielona-dolina-2/actions

## Kolejne aktualizacje

Publiczny `main` ma osobną historię utworzoną przez integrację GitHub. Nie używaj force push ani nie wysyłaj całej historii lokalnej. Aktualizuj przez integrację tylko pliki gry, testy, konfigurację budowania i publiczną dokumentację. `AGENTS.md`, lokalne instrukcje, dokumenty robocze, `outputs/`, zapisy graczy oraz prywatne ścieżki pozostają lokalnie.

Weryfikacja publikacji: workflow zakończył się sukcesem (209 testów), publiczna gra została otwarta i uruchomiona.
