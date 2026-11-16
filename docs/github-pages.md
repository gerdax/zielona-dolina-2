# Publikacja na GitHub Pages

Projekt jest przygotowany dla osobnego repozytorium `gerdax/zielona-dolina-2`. Nie zastępuje starszej gry w `gerdax/zielona-dolina`.

1. Właściciel konta loguje się do GitHub i tworzy publiczne repozytorium `zielona-dolina-2`, bez początkowego README.
2. Z katalogu projektu wysyła kod i historię:

```sh
git remote add origin https://github.com/gerdax/zielona-dolina-2.git
git push -u origin main
git push origin --tags
```

3. W repozytorium wybiera **Settings → Pages → Source → GitHub Actions**.
4. W **Actions** uruchamia lub ponawia workflow **Publish game to GitHub Pages**.
5. Po udanym wdrożeniu adres strony będzie widoczny w wyniku workflow. Oczekiwany adres: `https://gerdax.github.io/zielona-dolina-2/`.

Workflow instaluje zależności, uruchamia testy, buduje grę z właściwą ścieżką i publikuje `dist`. Następne zmiany na `main` wdrażają się automatycznie. Osada testowa jest dostępna przez dopisanie `?qa=village`.

Zapisy gry pozostają w przeglądarce gracza. Nowa domena nie odczyta lokalnych zapisów z `127.0.0.1`; można je przenieść przez Eksportuj/Importuj w menu gry.

Stan przygotowania: build i podgląd lokalny sprawdzone. Repozytorium i publiczne wdrożenie wymagają jeszcze utworzenia i zalogowania do GitHub. Sam plik workflow nie oznacza, że strona już działa.
