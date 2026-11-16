# Historia zmian

## [0.23.9] — 2026-11-16

- Nowy model wieży balistycznej: wygięte ramiona łuku, widoczna cięciwa, prowadnica, wiązki skrętne, wyciągarka z korbą i bełt z grotem oraz lotkami.
- Kamienne wzmocnienia narożników, warstwy muru, drewniana platforma, proporzec i stojak zapasowych bełtów wyróżniają wieżę.
- Zachowane płynne celowanie, nieruchoma podstawa i działanie istniejących zapisów. Model obejrzany; testy balisty i obrony oraz kompilacja przechodzą.

### Publikacja GitHub Pages — 2026-11-16

- Opublikowano wersję 0.23.8 w osobnym repozytorium `gerdax/zielona-dolina-2`. Gra działa pod https://gerdax.github.io/zielona-dolina-2/ .
- GitHub Actions: instalacja zależności, 209 testów, build i wdrożenie zakończone sukcesem. Publiczna gra otwarta i uruchomiona.
- Opublikowano wyłącznie pliki gry, testy i konfigurację. Lokalna historia, instrukcje oraz dokumenty robocze pozostały na komputerze.

### Publikacja 0.23.8 — 2026-11-16

- Gra uruchomiona na https://gerdax.github.io/zielona-dolina-2/ . Osada testowa dostępna przez `?qa=village`.
- GitHub Actions: 209 testów, build i wdrożenie zakończone sukcesem. Publiczny eksport obejmuje grę, testy i konfigurację; lokalne instrukcje i dokumenty robocze pozostają na komputerze.

## [0.23.8] — 2026-11-16

- Bełty balisty pozostawiają widoczne wbite trzpienie i pęknięcia na uszkodzonych murach i bramach; mocno uszkodzona krata traci pręty. Zniszczone konstrukcje zawalają się po dolocie bełtu, z istniejącymi dźwiękami i odłamkami.
- Uszkodzenie muru nie skraca podstawy pod blankami, dzięki czemu elementy nie wiszą w powietrzu.
- Przygotowano workflow GitHub Pages, testy, build z właściwą ścieżką i instrukcję publikacji. Publiczna strona nie została jeszcze wdrożona — potrzebne zalogowanie właściciela konta.
- 209 testów przechodzi; uszkodzenia, zawalenie i lokalny podgląd wersji do publikacji obejrzane.

## [0.23.7] — 2026-11-16

- Trafienie bełtu balisty w mur lub bramę wywołuje kurz i odłamki kamienia albo drzazgi drewna, zgodnie z materiałem. Efekt pojawia się po 0,45 s lotu, tylko raz na strzał; przetrwa zniszczenie strzelca lub celu podczas lotu.
- W osadzie testowej balista ma przycisk „Próba trafienia w mur”, tworzący pojedynczy wrogi cel ćwiczebny bez kosztu.
- Efekty obejrzane na kamieniu i drewnie; testy synchronizacji, materiałów, celu ćwiczebnego i dźwięków oraz kompilacja przechodzą.

## [0.23.6] — 2026-11-16

- Osobne dźwięki wystrzału balisty i trafienia bełtu, zsynchronizowane z lotem (trafienie po 0,45 s symulacji). Trafienie słychać przy celu, również po zniszczeniu wieży podczas lotu.
- Tłumienie odległości, panorama, obsługa wyciszenia i ukrytej karty oraz ograniczenie jednoczesnych salw. Brak odtwarzania zaległych ataków po wczytaniu.
- Działa na istniejących balistach w osadzie testowej. 11 testów dźwięków i kompilacja przechodzą.

## [0.23.5] — 2026-11-16

- Balista płynnie obraca się najkrótszą drogą, śledzi żywy cel i zwalnia przy końcu ruchu. Podstawa wieży pozostaje nieruchoma.
- Wystrzelony bełt zachowuje własny kierunek podczas dalszego obrotu broni. Działa także na balistach w istniejącej osadzie testowej.
- Testy zmiany celu, przejścia przez granicę kąta i różnych FPS oraz kompilacja przechodzą. Celowanie obejrzane w scenie.

## [0.23.4] — 2026-11-16

- Wieże i bastiony nie obracają całej konstrukcji podczas ostrzału. Zachowują ustawiony obrót; sama balista nadal celuje niezależnie od podstawy.
- Usunięto dodatkowy ogólny pocisk z ataku balisty, która ma własną animację bełtu. Sprawdzone w scenie przez kolejne strzały i kontrolę obrotu; kompilacja przechodzi.

## [0.23.3] — 2026-11-16

- „Napraw i odbuduj obronę” w panelu balisty, punktu zbiórki i menu osady testowej. Bezpłatnie odnawia umocnienia, odbudowuje ich ruiny i uzupełnia dedykowanych obrońców testowych.
- Plany obrony i obsady sprzed fali są zapisywane z osadą. Zachowane identyfikatory, położenie i połączenia konstrukcji; inne budynki i zasoby nie są resetowane. Trwający najazd lub zajęte miejsce blokują odbudowę.
- Testy naprawy, odbudowy, odtworzenia obsady, zapisu i ponownego uruchomienia fali przechodzą. Odbudowana balista i naprawiona brama sprawdzone w scenie; kompilacja przechodzi.

## [0.23.2] — 2026-11-16

- Trzy poziomy najazdu ćwiczebnego w panelu balisty i punktu zbiórki: mały (5 napastników, 1 taran), średni (12 napastników, 2 tarany, 1 katapulta), duży (24 napastników, 4 tarany, 3 katapulty).
- Każda fala sprawdza miejsca pojawienia i trasę przed uruchomieniem. Testy liczebności, machin, zapisu i zakończenia przechodzą; duża fala obejrzana.
- Na prośbę użytkownika osada testowa otrzymuje jednorazowo po 100 000 każdego zasobu z odpowiednim limitem magazynowym. W menu można ponownie uzupełnić zapasy; kampania pozostaje bez zmian.

## [0.23.1] — 2026-11-16

- W osadzie testowej balista i punkt zbiórki mają przycisk „Najazd ćwiczebny”: pięciu napastników i taran podchodzą przez kozły obronne i wilcze doły. Rozpoczyna alarm i mobilizuje dedykowanych obrońców testowych.
- Przycisk zakończenia usuwa wyłącznie wrogów ćwiczebnych. Po odparciu fali lub zakończeniu ćwiczenia wraca poprzedni stan alarmu. Blokada nakładania fal i kontrola dostępnej trasy nie dopuszczają do częściowego uruchomienia.
- Zapis zachowuje trwające ćwiczenie. Testy ostrzału balisty, pułapek, alarmu, zakończenia i zapisu oraz kompilacja przechodzą; fala obejrzana w scenie.

## [0.23.0] — 2026-11-15

- Siedem budowli w kategorii Obrona: bastion narożny, wieża balistyczna, wilcze doły, kozły obronne, brama warowna, punkt zbiórki i zbrojownia forteczna. Każda ma własny model i działanie.
- Bastion mieści trzech rzeczywistych łuczników na osobnych stanowiskach; wszyscy schodzą po zniszczeniu platformy. Balista strzela co 3 sekundy na 10 pól, szczególnie skutecznie przeciw machinom.
- Pułapki spowalniają i ranią wyłącznie wrogów. Brama ma animowaną kratę i rzeczywiste blokowanie przejścia. Zbrojownia zmniejsza obrażenia i leczy obrońców poza walką.
- Punkt zbiórki przypisuje wolne wojsko i kieruje nim podczas alarmu; łucznicy zajmują pobliskie wolne stanowiska.
- Nowe i istniejące osady testowe otrzymują cały zestaw, trzech łuczników bastionu i dwóch obrońców punktu. Migracja zachowuje zasoby i postęp.
- Modele obejrzane; testy walki, pojemności bastionu, bramy, alarmu, migracji i zapisu oraz kompilacja przechodzą.

## [0.22.1] — 2026-11-15

- Osada testowa otrzymuje remizę z przydzielonym strażakiem oraz chatę ćwiczebną. Przycisk w panelu remizy rozpoczyna powtarzalny pożar wyłącznie tej chaty.
- Bezpłatna, jednorazowa migracja istniejącej osady zachowuje zasoby i postęp. Uzupełnia także zajazd, spichlerz, stajnię, młyn i studnię.
- Zapisano zasadę wyposażania osady testowej przy każdej nowej funkcji. Testy migracji, gaszenia, zapisu i sesji przechodzą; osada obejrzana w przeglądarce.

## [0.22.0] — 2026-11-15

- Remiza strażacka w kategorii Osada: model z dzwonem, drabiną i wózkiem z wiadrami. Przydzielony pracownik sam dociera do dostępnego pożaru w promieniu 10 pól i wraca do remizy.
- Trafienia katapulty podpalają drewniane budowle. Ogień zadaje obrażenia, stopniowo wygasa i jest widoczny ponad dachem. Strażak gasi strumieniem wody; studnia do 6 pól od remizy podwaja tempo.
- Pożary i przydziały zachowują się w zapisie; panele pokazują stan pożaru i strażaka. 185 testów i kompilacja przechodzą, gaszenie obejrzane w scenie.

## [0.21.0] — 2026-11-15

- Nowy zajazd leczy pobliskie jednostki i oferuje dostawę 30 żywności za 25 monet co 90 sekund. Czas zlecenia jest zapisany z budowlą.
- Nowy spichlerz dodaje 500 pojemności żywności; wspólny limit jest uwzględniany w produkcji, zakupach, dodatkach i powrotach kupców.
- Stajnia ma osobny model otwartych boksów, pozwala kupować kolejne konie i leczy pobliskie wierzchowce.
- Pracujący młyn zwiększa plony pobliskich pól i gospodarstw o 25%; kilka młynów nie mnoży premii. Studnia nadal nawadnia pola.
- Cały zestaw dostępny w budowie. Modele i paleta obejrzane; 182 testy i kompilacja przechodzą.

## [0.20.5] — 2026-11-15

- Stukot kopyt i okresowe skrzypienie wozu kupca podczas rzeczywistego ruchu, z tłumieniem odległości i panoramą. Postój, wyciszenie i ukryta karta nie kolejkują dźwięków; maksymalnie trzy odgłosy jednocześnie.
- Testy sterowania dźwiękami i kompilacja przechodzą.

## [0.20.4] — 2026-11-15

- Koń w zaprzęgu kupca porusza nogami podczas jazdy i łagodnie zatrzymuje chód na postoju; ogon reaguje na ruch.
- Woźnica wyciąga ręce i trzyma dwie widoczne lejce prowadzące do uzdy konia.
- Ruch obejrzany w scenie, kompilacja produkcyjna przechodzi.

## [0.20.3] — 2026-11-15

- Kupcy i karawany mają drewniany wóz z otwartą płócienną osłoną, skrzyniami i workami, woźnicą oraz koniem w zaprzęgu. Szprychowe koła obracają się wokół osi jazdy.
- Model obejrzany w scenie; kompilacja produkcyjna przechodzi. Istniejące trasy i zapisy zachowują stan.

## [0.20.2] — 2026-11-15

- Czytelny model kopalni: odsłonięte ciemne wejście, drewniane podpory i belka z okuciami, latarnia oraz krótki tor z wózkiem pełnym rudy.
- Głazy otaczają wejście zamiast je zasłaniać. Zmiana wyglądu działa również w istniejących zapisach.
- Model obejrzany w scenie; kompilacja produkcyjna przechodzi.

## [0.20.1] — 2026-11-15

- Nowe i istniejące osady testowe otrzymują komplet sześciu nowych budowli. Rozmieszczenie szuka wolnych pól, zachowując istniejące konstrukcje i postęp.
- Dedykowani pracownicy stoczni i warsztatu naprawczego, kupiec przy posterunku, transportowiec oraz trzyosobowa załoga na brzegu pozwalają od razu sprawdzać funkcje.
- Uzupełnienie jest bezpłatne, jednorazowe i nie powiela jednostek ani nie resetuje zasobów. Działa wyłącznie dla `?qa=village`, w osobnej bazie zapisów.
- Testy kompletności i powtarzalnej migracji przechodzą; rozszerzona osada obejrzana i zapisana przez menu gry.

## [0.20.0] — 2026-11-15

- Sześć funkcjonalnych budowli z własnymi modelami: brama wodna, schody na mury, stocznia, posterunek kupiecki, warsztat naprawczy i wieża sygnałowa.
- Brama wodna zmienia dostępność przeprawy dla łodzi; automatycznie wpuszcza swoich, blokuje wrogów i czeka na opróżnienie przy zamykaniu. Schody zapewniają szybsze wejście istniejących łuczników na pobliskie stanowiska.
- Stocznia woduje łodzie i transportowce. Transportowiec przewozi bohatera oraz trzech rzeczywistych pasażerów; zaokrętowanie, zapis, wysiadanie i utrata kadłuba zachowują spójne relacje jednostek. Pracownik stoczni naprawia łodzie.
- Posterunek zatrudnia własnych kupców do istniejącego systemu stałych tras, skraca postój między kursami i chroni pobliskich kupców redukcją obrażeń oraz regeneracją. Warsztat naprawczy zużywa materiały do automatycznej naprawy żywych fortyfikacji.
- Wieża sygnałowa ostrzega 180 sekund przed najazdem, pokazuje kierunek i wykrywa pobliskich wrogów. Alarm jest widoczny jako ogień sygnałowy.
- Zlecenie machiny korzysta z zaznaczonego warsztatu; nowe machiny i kupcy nie pojawiają się na zajętym polu.
- 175 testów i build przechodzą. Modele obejrzane i wszystkie pozycje sprawdzone w palecie. Zapis kampanii nie był zastępowany scenariuszem testowym.

## [0.19.0] — 2026-11-15

- „Odbuduj całość” pokazuje łączny koszt i przywraca połączone ruiny murów, bram i wież do pierwotnych typów. Grupę można wskazać przez ruinę albo ocalały fragment. Koszt: 60 drewna i 50 kamienia za zniszczoną część.
- Odbudowa zachowuje położenie, obrót, identyfikatory i połączenia. Ocalałe części nie są ponownie budowane ani opłacane. Bohater podchodzi po jednym kliknięciu; opłata następuje przy wykonaniu.
- Brak zasobów, wróg w pobliżu dowolnej odbudowywanej części lub zajęte miejsce blokują całą operację. Nowe ruiny zapisują dawnego właściciela; znane obce ruiny są pomijane. Starsze ruiny bez właściciela pozostają dostępne jak w dotychczasowej pojedynczej odbudowie.
- Testy kosztu, zachowania tożsamości, podejścia, blokad i zapisu przechodzą; odbudowa trzech elementów sprawdzona w osobnym podglądzie.

## [0.18.0] — 2026-11-15

- „Napraw całość” w panelu dowolnego muru, bramy lub wieży naprawia fizycznie połączone własne fortyfikacje. Przycisk pokazuje łączny koszt uszkodzonych elementów: 15 drewna i 10 kamienia za część.
- Zdrowe części są pomijane; brak surowców blokuje całą operację. Zachowane położenie, obsada, połączenia oraz ustawienia bram. Domy, obce budowle i ruiny pozostają bez zmian.
- Koszt aktualizuje się po zmianie zdrowia dowolnej części grupy, także gdy zaznaczony fragment jest zdrowy. 159 testów i build przechodzą; przycisk obejrzany w panelu bramy.

## [0.17.1] — 2026-11-15

- Trzaski pękania przy pogłębieniu uszkodzeń oraz warstwowy odgłos zawalenia dokładnie przy rozpoczęciu zapadania modelu. Kamień ma brzmienie kruszącego się gruzu, drewno — pękających belek.
- Efekty pochodzą ze zdarzeń renderowanej animacji, nie z niezależnego zegara. Wczytanie uszkodzonego muru, naprawa lub stara ruina nie odtwarzają dźwięku ponownie.
- Zachowane wyciszenie, tłumienie z odległością i panorama stereo; limit jednoczesnych dźwięków zniszczenia. 155 testów i build przechodzą; Web Audio i sygnały animacji sprawdzone w przeglądarce bez błędów konsoli.

## [0.17.0] — 2026-11-15

- Mury i bramy pokazują trzy stopnie uszkodzeń zależne od zdrowia: pęknięcia, wyszczerbienia, ubytki blanków i połamane elementy bramy. Naprawa przywraca pełny model.
- Zniszczenie fortyfikacji przez taran lub katapultę uruchamia opóźnione do momentu trafienia zawalenie, większy obłok kurzu i odłamki. Mur zapada się, a na jego miejscu zostaje niski gruz lub połamane belki zamiast modelu monumentalnej ruiny.
- Ruiny zachowują dotychczasową tożsamość i możliwość odbudowy; zapis zachowuje przyczynę zniszczenia. Wczytanie starych ruin nie odtwarza zawalenia.
- 152 testy i build przechodzą; stopnie uszkodzeń i pozostałości obejrzane w scenariuszu ostrzału.

## [0.16.2] — 2026-11-15

- Trafienie pocisku katapulty w budowlę tworzy obłok kurzu i rozrzut odłamków po zakończeniu lotu. Taran tworzy mniejszy wybuch pyłu w chwili wysunięcia belki.
- Materiał trafionej budowli określa kamienne okruchy albo drewniane drzazgi. Cząstki opadają, rozpraszają się i szybko zanikają.
- Efekty mają limit 180 cząstek; geometria jest współdzielona, wygasłe cząstki są usuwane. Bez zmian obrażeń i zapisów. Testy trajektorii i wygaszania oraz build przechodzą; efekty obejrzane w scenariuszu ataku.

## [0.16.1] — 2026-11-15

- Syntezowany trzask i świst wyrzutu katapulty oraz ciężkie uderzenie tarana, uruchamiane w odpowiednich fazach rzeczywistej animacji ataku.
- Głośność maleje z odległością od kamery, położenie wpływa na panoramę stereo. Wyłączenie dźwięku wycisza machiny; stare i niewidoczne ataki nie tworzą kolejki dźwięków. Limit jednoczesnych odgłosów chroni przed nadmiernym nakładaniem.
- Testy synchronizacji, jednokrotnego odtworzenia, wyciszenia i limitu głosów oraz build przechodzą. Odtwarzanie Web Audio sprawdzone w przeglądarce bez błędów konsoli.

## [0.16.0] — 2026-11-15

- Katapulta wykonuje naciąg, zamach i powrót ramienia, ukrywa wyrzucony kamień i przeładowuje misę. Kamienny pocisk leci po wysokim łuku do faktycznego celu ataku.
- Taran cofa belkę, wysuwa ją przy uderzeniu i wraca do pozycji spoczynkowej; punkt uderzenia otrzymuje krótki efekt trafienia.
- Animacje uruchamia rzeczywiste zdarzenie ataku z symulacji. Machiny mają osobne ruchome modele zamiast nieruchomej wspólnej geometrii. Obrażenia i częstotliwość ataków pozostają zgodne z dotychczasową symulacją.
- Testy faz animacji, rzeczywistego celu i zapisu oraz build przechodzą. Ataki obejrzane w osobnym scenariuszu.

## [0.15.6] — 2026-11-15

- Nowy taran: otwarta rama, zawieszona belka z metalową głowicą i niska dwuspadowa osłona zamiast dachu przypominającego dom.
- Nowa katapulta: trójkątne podpory, oś i wiązka skrętna, ramię z misą na pocisk, kamień oraz wyciągarka z korbą i liną.
- Obie machiny mają koła ze szprychami, obręcze i widoczne osie. Wyłącznie zmiana oprawy; build przechodzi, modele obejrzane w przeglądarce.

## [0.15.5] — 2026-11-15

- Łódka obraca się płynnie najkrótszym łukiem, z ograniczoną prędkością skrętu i łagodnym dojściem do nowego kierunku.
- Skręt jest aktualizowany między krokami symulacji i niezależny od liczby klatek; po powrocie z tła nie wykonuje nagłego obrotu.
- Testy limitu obrotu, przejścia przez granicę kąta i różnych częstotliwości klatek oraz build przechodzą.

## [0.15.4] — 2026-11-15

- Obrót łodzi uwzględnia faktyczną oś dziobu modelu, więc płynie przodem zamiast bokiem.
- Kołysanie korzysta z bezwzględnej wysokości powierzchni wody, bez kumulowania przesunięć kolejnych klatek. Dno pozostaje ponad wodą i geometrią fal.
- Testy kierunków i prześwitu dna przechodzą; build przechodzi. Ruch i wnętrze obejrzane w osobnym podglądzie.

## [0.15.3] — 2026-11-15

- Nowy model łódki: otwarty, smukły kadłub z pasami desek, ostrym dziobem, ławkami, obrzeżem, sterem i odłożonymi wiosłami.
- Żagiel z wygiętej powierzchni płótna zamiast grubej prostokątnej płyty; takielunek i proporczyk w kolorach przystani.
- Wyłącznie zmiana oprawy. Build przechodzi; model obejrzany przy przystani w przeglądarce.

## [0.15.2] — 2026-11-15

- Nowe łodzie cumują na wolnej wodzie obok pomostu, z uwzględnieniem kierunku przystani i zajętych miejsc. Budowa bez dostępnego miejsca cumowania jest blokowana.
- Bezczynne łodzie ze starszych zapisów, nakładające się na pomost, przechodzą na bezpieczne miejsce z zachowaniem tożsamości i pasażera. Aktywny rozkaz ruchu nie jest zmieniany.
- Wsiadanie zachowuje podejście bohatera wzdłuż brzegu do nowego miejsca. 133 testy i build przechodzą; cumowanie obejrzane w osobnym podglądzie.

## [0.15.1] — 2026-11-15

- Osobny model przystani: dom portowy z morskim dachem i szyldem kotwicy, połączony z pomostem na palach.
- Czytelna wyciągarka z odkrytym bębnem liny, metalowymi obręczami, korbą, wysięgnikiem, bloczkiem i hakiem. Słupki cumownicze oraz odbojnice wyznaczają otwarte miejsce do wsiadania.
- Zmiana oprawy istniejących przystani bez zmiany symulacji i zapisów. Build przechodzi; model obejrzany w przeglądarce.

## [0.15.0] — 2026-11-15

- Osobna grywalna osada testowa pod `?qa=village`: rozwinięta gospodarka, 8 łuczników, inne jednostki, konie, 1500 podstawowych surowców, 300 żelaza, 5000 monet i 500 klejnotów.
- Drewniany ciąg fortyfikacji z obsadą, kamienne stanowiska, kanał, wąwóz i kamienny most do prób budowy, ulepszania i rozbiórki. Najazd odłożony o godzinę czasu gry.
- Własna baza zapisu oraz odtwarzanie sesji. Ręczny zapis i autosave działają niezależnie od kampanii; zakupy również nie mogą zapisać tej osady w kampanii.
- Test scenariusza i walidacji zapisu przechodzi; build produkcyjny przechodzi. Osada otwarta i zapis ręczny sprawdzony w osobnej karcie.

## [0.14.0] — 2026-11-15

- „Ulepsz cały mur” przebudowuje połączone drewniane palisady, bramy i wieże na kamienne. Przycisk pokazuje łączny koszt kamienia; istniejąca kamienna część nie jest ponownie opłacana.
- Zachowane identyfikatory, położenie, szerokość palisady, połączenia, obsada i tryb bram. Uszkodzenia zachowują proporcję zdrowia. Podczas wchodzenia, schodzenia lub marszu łuczników ulepszenie czeka.
- Brak kamienia anuluje całą operację. Powtórne ulepszenie nie pobiera zasobów. Kamienny wał zachowuje szerokość starej palisady, aby nie rozrywać konstrukcji.
- 128 testów oraz build produkcyjny przechodzą.

## [0.13.2] — 2026-11-15

- „Rozbierz cały mur” usuwa jednym kliknięciem stykające się własne mury, bramy i wieże. Nie obejmuje domów ani budynków gospodarczych. Zwraca połowę kosztów i usuwa nieaktualne połączenia.
- Obsada, wchodzący lub przechodzący łucznicy oraz jednostka na dowolnym polu blokują całą operację bez częściowej rozbiórki.
- Kamienny most ma odrębny model z kamienną płytą, podporami, balustradami i podziałem na bloki, zamiast drewnianych desek oraz słupów.
- 124 testy i build przechodzą. Panel muru obejrzany w osadzie; model mostu sprawdzony w osobnym podglądzie bez dostępu do zapisu.

## [0.13.1] — 2026-11-15

- „Rozbierz cały most” po zaznaczeniu dowolnego własnego odcinka. Usuwa ciągłą przeprawę, zwraca połowę materiałów za każdy segment i pozostawia kanał lub wąwóz pod spodem.
- Rozbiórka całej przeprawy jest atomowa: zajęty lub cudzy odcinek blokuje całą operację. Oddzielne i równoległe mosty pozostają bez zmian. Nadal można rozebrać pojedynczy odcinek.
- 118 testów i build produkcyjny przechodzą; nowy przycisk obejrzany w osadzie użytkownika bez rozbierania jego mostów.

## [0.13.0] — 2026-11-14

- Most od brzegu do brzegu przez przeciągnięcie: dopasowanie do osi siatki, długości ciągłego kanału, wąwozu lub rzeki oraz automatyczny obrót wszystkich segmentów. Nadmiar suchego brzegu nie zwiększa kosztu.
- Podgląd całej przeprawy, liczba odcinków, łączny koszt i konkretna przyczyna blokady. Zwolnienie przycisku buduje komplet albo nic, bez częściowych wydatków.
- Segmenty tworzą połączoną konstrukcję; zachowane podłoże, nawigacja i zapis. Pojedyncze kliknięcie nadal stawia jeden odcinek.
- 114 testów przechodzi; sprawdzono interfejs narzędzia w zapisanej osadzie.

## [0.12.0] — 2026-11-14

- Mosty nad kanałem, wykopem i nowym wąwozem: podłoże ma pierwszeństwo przed przyciąganiem do brzegu, także przy połączonych przekopach. Panel przekopu udostępnia drewniany i kamienny most.
- Przeprawa zachowuje połączenia konstrukcji i typ podłoża. Po rozebraniu wraca właściwy kanał lub wąwóz; zalewanie i nawigacja pozostają spójne.
- Pomost przystani otrzymał pale i poręcze, odróżniające go od łodzi i unoszącej się platformy.
- 106 testów i build produkcyjny przechodzą. Pomost obejrzany w bieżącej osadzie.

## [0.11.0] — 2026-11-14

- Łucznicy przechodzą po stykających się murach i wieżach bez schodzenia na ziemię. Różnice wysokości łączą drewniane pochylnie. Zajęte stanowisko zatrzymuje marsz do zwolnienia przejścia.
- Rozkaz „Przejdź po murze” oraz kliknięcie połączonego stanowiska; zatrzymanie i zmiana celu zachowują ciągłość ruchu. Stan marszu jest zapisywany.
- Buduj → Przeprawy → Usuń ścieżki: kliknięcie lub przeciągnięcie usuwa drogi, również początkowe. Usunięte odcinki nie wracają po wczytaniu; drogi początkowe nie dają zwrotu materiałów.
- 96 testów przechodzi; build produkcyjny i kontrola interfejsu w obecnej osadzie wykonane.

## [0.10.1] — 2026-11-14

- Łucznicy stoją na rzeczywistych podestach murów, palisad i wież zamiast wspólnego wzniosu 2,2. Wysokość drogi pod fortyfikacją nie dodaje się do stanowiska.
- Kamienne blanki zostawiają miejsce na stopy; palisada ma rzeczywisty drewniany podest z podporami. Punkt stanowiska obraca się razem z konstrukcją.
- Wchodzenie, schodzenie i pierścień zaznaczenia korzystają z tej samej powierzchni oparcia. Zapisane stany obsady pozostają zgodne.
- 89 testów i build przechodzą; poprawione stanowiska obejrzane w obecnej osadzie w przeglądarce Codexa.

## [0.10.0] — 2026-11-14

- Dziesięć powtarzalnych dodatków za klejnoty do natychmiastowego użycia w obecnej osadzie: materiały budowlane, żywność, żelazo, monety, łucznicy, osadnicy, leczenie, naprawy, koń i wielbłąd.
- Sklep ma kategorie Osada, Obrona i Podróż. Pakiety na nowe wyprawy pozostają osobno rozwijane. Każdy produkt pokazuje koszt, efekt i konkretny powód blokady.
- Cała dostawa musi mieścić się w magazynach; posiłki wymagają wolnych, odrębnych miejsc przy osadzie. Leczenie i naprawa obejmują tylko żywe własne jednostki oraz istniejące budowle.
- Zakup jest zapisywany przed przyznaniem efektu. Rejestr transakcji chroni przed podwójną opłatą i powieleniem efektu po wczytaniu; niedostarczony pakiet zwraca klejnoty. Historyczne zakupy pozostają czytelne po zmianie cennika.
- Dodatki nie resetują osady i nie zastępują istniejących jednostek. Podpowiedzi mapy przestają zasłaniać panel po opuszczeniu kursorem mapy.
- 85 testów przechodzi. Build produkcyjny oraz przegląd sklepu w przeglądarce Codexa wykonane.

## [0.9.0] — 2026-11-14

- +10 klejnotów za każdą odpartą falę najazdu. Gra zapisuje napastników i potwierdza ich pokonanie; zniknięcie jednostek lub utrata bronionej siedziby nie daje nagrody.
- Nagrody 5–25 klejnotów za rozwój osady, wyszkolenie obrony, sojusz/przyłączenie sąsiada, odbudowę ruin, dwór/zamek i ukończenie regionu.
- +5 za pierwszy zakończony kurs handlowy oraz +15 za dziesięć kursów. Liczone są powroty z zapłatą, a nie samo wysłanie kupca.
- Zakładka Zadania pokazuje cele, postęp i nagrody; śledzony cel ma plakietkę klejnotów. Panel aktualizuje się po wykonaniu zadania lub odparciu fali.
- Nagrody są automatyczne i jednorazowe dla danego zadania lub fali. Znane wykonane zadania i zachowana historia kupców rozliczają się w starszych zapisach. Nowa wyprawa resetuje postęp zadań i najazdów, zachowując portfel oraz dodatki.
- Odpieranie najazdu potwierdzane jest dźwiękiem sukcesu zamiast alarmu. Aktualizacja nie otwiera ponownie już obejrzanego finału regionu.
- 76 testów przechodzi; build oraz przegląd panelu nagród w osadzie użytkownika wykonane.

## [0.8.0] — 2026-11-14

- Klejnoty i dodatki przeniesione z pierwszej gry: +10 za pierwsze pokonanie obozu bandytów lub zdobycie danej osady. Nagrody są jednorazowe, także po wczytaniu. Pokojowy sojusz nie przyznaje klejnotów.
- Pakiety startowe w oryginalnych cenach: 3 żołnierzy za 50 klejnotów oraz 3 domy, drwal, kamieniołom, gospodarstwo i 2 pola za 400. Kupowane raz, działają na każdej nowej wyprawie.
- Natychmiastowa zmiana stroju bohatera, koloru i imienia psa, koloru sztandaru oraz herbu. Autorskie warianty modeli 3D, bez zmian statystyk.
- Licznik klejnotów otwiera panel Dodatki; dostęp również przez menu i księgę królestwa. Nowa wyprawa wymaga osobnego potwierdzenia i pobiera kopię dotychczasowego zapisu.
- Klejnoty, zakupy i wygląd pozostają na kolejnej wyprawie. Starsze zapisy otrzymują brakujący profil i nagrody za wcześniej wykonane podboje bez resetowania osady.
- Nieudany zapis zakupu przywraca klejnoty i stan dodatków. Aktualna osada nie otrzymuje bonusów startowych przez samo kupienie pakietu.
- 70 testów i build produkcyjny przechodzą. Sprawdzono panel, naliczenie historycznej nagrody i zmianę stroju w przeglądarce Codexa.

## [0.7.0] — 2026-11-14

- Własnych kupców można zatrudniać w targu za 30 monet i 20 drewna. Kupiec pozostaje tą samą jednostką po powrocie.
- Wybór pokojowej osady, towaru i ładunku 1–100 sztuk; jednorazowa wyprawa lub stała trasa. Zapłata trafia do skarbca dopiero po powrocie, sojusznicy płacą 20% więcej.
- Rzeczywisty ładunek jest odejmowany przy wyjeździe, a pieniądze i niesprzedany towar pozostają na wozie aż do rozładunku. Brak towaru i zablokowane przejście powodują oczekiwanie.
- Zakończenie stałej trasy po bieżącym kursie oraz powrót z ładunkiem na żądanie; wybuch wojny przerywa sprzedaż i kieruje kupca do domu.
- Trasy, ładunek, liczba kursów i stan podróży zachowują się w zapisie. Targ pokazuje przypisanych kupców.
- Zgodność ze starszą reprezentacją wędrownego kupca oraz zachowanie kopii sesji przy błędzie aktualizacji, zamiast jej bezpowrotnego usuwania.
- 64 testy obejmują gospodarkę, stałe kursy, blokady, odwołanie, wojnę i zapis. Potwierdzono w przeglądarce działającą stałą trasę do Kamiennego Brodu.

## [0.6.0] — 2026-11-14

- Wędrowni kupcy Dobromir, Mira i Radomir przyjeżdżają rzeczywistym wozem, zatrzymują się przy osadzie lub targu na 120 sekund i odjeżdżają. Kolejne wizyty co około 4 minuty, bez dublowania kupców.
- Panel kupca: kupno i sprzedaż drewna, kamienia, żywności oraz żelaza za monety. Widoczne zapasy, monety kupca, ceny i czas pozostały na handel.
- Ograniczony towar i gotówka po obu stronach; konkretne przyczyny blokady i ochrona przed zakupem ponad pojemność magazynów.
- Kupiec oczekuje przy zablokowanej drodze, korzysta z automatycznych bram i odjeżdża przy pobliskim zagrożeniu. Zapis zachowuje zapasy, trasę i harmonogram wizyt.
- Istniejące karawany gracza zachowują swoje działanie.
- 58 testów i build przechodzą. Sprawdzono myszą zakup żelaza i sprzedaż drewna.

## [0.5.0] — 2026-11-14

- Przesuń całość i Obróć całość w panelu dowolnego skrzydła połączonej konstrukcji.
- Podgląd wszystkich części podczas przesuwania, obrót podglądu przyciskiem lub R, anulowanie przyciskiem, Escape lub PPM.
- Wszystkie części zmieniają położenie jednocześnie, zachowując geometrię połączeń, identyfikatory, zdrowie, zasoby i zadania budowli.
- Wspólna walidacja podglądu i operacji obejmuje każdy obrys, przeszkody, teren, granice mapy i zajęte stanowiska. Błąd choć jednej części blokuje całą operację.
- Wspólny dach i nawigacja aktualizują się po zmianie położenia; pracownicy otrzymują trasę do przeniesionego miejsca pracy.
- 54 testy przechodzą; sprawdzono myszą przesunięcie i obrót połączonego magazynu z gospodarstwem. Build produkcyjny przechodzi.

## [0.4.0] — 2026-11-14

- Bezpośrednie łączenie ścian zastępuje ścieżki między budynkami. Połącz dosuwa istniejącą budowlę do wolnej ściany sąsiada.
- Domy i budynki gospodarcze tworzą ciągłe bryły; prostokątne zestawy zgodnych skrzydeł otrzymują jeden wspólny dach.
- Domyślnie włączone przyciąganie podczas budowy, z uwzględnieniem obróconych wymiarów. Zielony podgląd potwierdza połączenie; przełącznik pozwala wyłączyć przyciąganie.
- Wspólna walidacja podglądu i budowy: kolizje brył, przeszkody, jednostki i teren. Nawigacja blokuje obrys połączonej konstrukcji.
- Dokładne położenie, wspólne konstrukcje i orientacja zachowują się po zapisie.
- 50 testów i build przechodzą. Sprawdzono myszą wspólny dach magazynu i gospodarstwa oraz automatyczne dostawienie domu.

## [0.3.0] — 2026-11-14

- Obrót budowli o 90° w podglądzie: przycisk Obróć lub R, oraz obracanie postawionych budynków z panelu.
- Wszystkie własne budowle można łączyć parami w kompleksy: Połącz → wskaż budowlę do 4 pól. Widoczne łączniki i Odłącz; każda budowla zachowuje swoją funkcję.
- Mosty grupują się wzdłuż obróconej osi, z zachowaniem przerw i oddzielnych kierunków. Mur przeciągany odcinkiem dostosowuje kierunek do odcinka, drogi mają ciągłą nawierzchnię.
- Obrót zajętej budowli jest blokowany; wieloodcinkowy most należy orientować przed połączeniem.
- Orientacja i połączenia są zachowywane w zapisie, ze sprawdzaniem danych importu.
- 48 testów i build przechodzą. Sprawdzono myszą obrót magazynu, połączenie z gospodarstwem, odłączenie i obrót podglądu.

## [0.2.4] — 2026-11-14

- Przycisk Odznacz postać oraz Odznacz grupę zamyka zaznaczenie i usuwa aktywnych odbiorców nowych rozkazów, zachowując wykonywane zadania.
- Sprawdzono w przeglądarce odznaczanie i powrót pustego panelu; build produkcyjny przechodzi.

## [0.2.3] — 2026-11-13

- Przycisk Anuluj w rzędzie działań jednostek i grup; wychodzi z wyboru celu, nie zmieniając bieżącego rozkazu.
- Sprawdzono myszą wybór Przydziel → Anuluj i powrót do zwykłego sterowania.

## [0.2.2] — 2026-11-13

- Dachy budynków mają wyraźną kalenicę, większy spadek i płaskie połacie zamiast wygładzonego ostrosłupa, który wyglądał na wklęsły.
- Sprawdzono wygląd w przeglądarce; build produkcyjny przechodzi.

## [0.2.1] — 2026-11-13

- Woda jest widoczna ponad dnem zalanych kanałów; połączone odcinki mają wspólne brzegi bez poprzecznych przegród.
- Kamienie i trzciny znikają w miejscu wykopów, mostów i przystani.
- Panel rozróżnia kanał z wodą i suchy wykop wymagający połączenia z rzeką.

## [0.2.0] — 2026-11-13

- Usunięta pauza taktyczna, automatyczna pauza po utracie fokusu i zatrzymywanie podczas wczytywania/menu.
- LPM na ziemi prowadzi jednostkę; przeciąganie LPM przesuwa mapę. Osobny tryb prostokąta zaznaczenia, płynne przeciąganie minimapy i zoom pod kursorem.
- Paleta budowy znika po wyborze, pozostawiając krótki pasek aktywnej budowli i przycisk zakończenia.
- Pełny katalog 46 budowli w pięciu kategoriach: 7 osady, 13 produkcyjnych, 11 obronnych, 9 infrastrukturalnych i 6 dekoracyjnych.
- Działające nawadnianie, pola, młyny, hodowla, leśnictwo, kopalnia złota, handel produkcyjny, pancerze, machiny i hodowla wielbłądów.
- Kamienne i drewniane fortyfikacje, warianty mostów, drogi, połączone zalewane kanały i fosy, źródła światła i dekoracje.
- Wspólna walidacja podglądu i rzeczywistej budowy; spójne grupowanie ciągłych przepraw, bez łączenia przerw.
- Zachowanie sesji oraz kamery podczas deweloperskich aktualizacji, aby nie tracić postępu w trakcie testów.

## [0.1.1] — 2026-11-13

- Zmniejszony offset i zakres głębokości cieni, usuwający efekt lewitowania.
- Podstawy modeli wyrównane do ziemi, a jednostki do wysokości dróg i pomostów.
- Zachowany postęp bieżącej rozgrywki podczas aktualizacji grafiki.

## [0.1.0] — 2026-11-13

Pierwszy niezależny region Zielonej Doliny II.

- Izometryczne 3D, autorskie modele, animowana woda, jednostki, przeprawy i efekty walki.
- Interfejs kontekstowy, minimapa, paleta budowy, księga królestwa i aktywna pauza.
- Produkcja z rzeczywistymi pracownikami, magazyny, rekrutacja, kuźnia i lecznica.
- Bramy ręczne/automatyczne, most zwodzony z oczekiwaniem na opróżnienie, strzelcy na fortyfikacjach.
- Dosiadanie konia, pies z podążaniem i ostrzeganiem, łódź z bohaterem jako pasażerem.
- Patrole, eskorta, alarm mieszkańców, karawany, dwa sąsiedztwa, sojusz lub podbój.
- Najazdy, bandyci, odbudowa ruin, regionalne zwycięstwo i dalsza gra.
- IndexedDB, autosave, poprzednia kopia zapisu, eksport/import i walidacja.
- Testy symulacji i zapisu oraz scena obciążeniowa w trybie deweloperskim.

### Granice wydania

Jeden region 64×64. Budowa jest natychmiastowa, region widoczny od początku. Czas kampanii 45–60 minut jest celem dalszego balansu, nie zweryfikowaną długością. Pustynia, wielbłądy, duża flota, pory roku i pozostałe etapy są opisane w katalogu rozwoju. Obsługa telefonu i tabletu wymaga osobnej rundy testów.
