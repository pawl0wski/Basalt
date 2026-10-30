# POSTEP: design system Basalt (`@basalt/ui` + Storybook)

Plik prowadzony po polsku, bo to dziennik pracy z właścicielem. Dokumentacja w Storybooku i interfejs są po angielsku.

Materiały źródłowe: `lekcja6/referencje.md`, `lekcja6/tokeny.md`, `.ai/specs/product-brief.md`, `.ai/specs/backlog.md`, specyfikacje E01-S01 (`2026-10-24-markdown-notes-and-app-foundations.md`) i E01-S03 (`2026-10-25-images-in-notes.md`), `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`.

## Status

| Etap | Stan |
|---|---|
| 0. Inwentaryzacja i plan | wykonany, decyzje zatwierdzone przez właściciela (2026-10-25) |
| 1. Fundamenty | wykonany, zweryfikowany, czeka na zatwierdzenie Partii 1 i „dalej” do Etapu 2 |
| 2. Komponenty bazowe | Partie 1, 2 i 3 zbudowane i zweryfikowane (2026-10-30), czekają na przegląd właściciela; Etap 3 po „dalej” |
| 3. Komponenty produktu, wzorce, ekrany | nie zaczęty |
| 4. Strony, które uczą | nie zaczęty |
| 5. Sprawdzenie i raport | nie zaczęty |

**Następny krok:** Właściciel ogląda Partie 1-3 (Primitives w Storybooku), rozstrzyga pytania i propozycje poniżej i podaje „dalej” do Etapu 3 (komponenty produktu, wzorce, ekrany).

---

## Zatwierdzone decyzje

### Decyzje bazowe (źródło: tokeny.md i referencje.md, zatwierdził Jakub Pawłowski)

- Charakter: skupiony, grafitowy, własny, narzędziowy, uporządkowany.
- Antycharakter: generyczny, krzykliwy, infantylny, ukrywający funkcje, chmurowo-korporacyjny.
- Antyreferencje: A01 (generyczny AI), A02 (Notion), AB1 (SaaS z kontem), AB2 (doklejony plugin), AB3 (niewidoczna synchronizacja).
- Konflikty rozstrzygnięte: poziomy czerni VS Code, ramy ciemniejsze niż edytor (R02.2); pasek tytułu z kartami (R01.3); akcent niebieski `#006cbe`, zmienny przez użytkownika (R01.2, R02.3); minimalnie w dekoracji, nie w funkcjach (R01.7, R02.1, A02); kolumna notatki wyśrodkowana, 700 px (R01.8); prawa sekcja otwarta od startu.
- Motyw: tylko ciemny (tokeny.md, zasada 17). Font systemowy (tokeny.md, zasada 9). Interfejs tylko po angielsku (W3, S01 G10).

### Decyzje właściciela z Etapu 0 (zatwierdzone 2026-10-25)

1. **Motyw i akcent:** Na ten moment zostajemy tylko z ciemnym motywem. Jasny motyw trafia do „What is missing” z możliwością stworzenia w dalekiej przyszłości osobnego epika. Dodany przełącznik akcentu w pasku Storybooka (R01.2: niebieski `#006cbe` domyślny, zielony `#3b9400` Obsidian, bursztynowy, fioletowy).
2. **Zakres komponentów bazowych:** Toast, RadioGroup i Popover zostaną zbudowane (będą potrzebne później). Avatar pominięty na mocy antyreferencji AB1 (brak awatarów).
3. **Wzorce bez bezpośredniej specyfikacji:** Zbudować listę z filtrami (z listy notatek), widok szczegółów (z notatki) oraz potwierdzenie usunięcia (dla planowanego E01-S04), oznaczając je w dokumentacji jako propozycje.
4. **Stack testowy Vitest:** Vitest 5 z `@vitest/browser-playwright` w `packages/ui` dla testów stories i a11y, root aplikacji pozostaje na Vitest 3.2.7.
5. **Istniejący kod (zasada 12):** Zgoda na przepisanie `Button` na tokeny w Etapie 2, przestawienie `components.json` na `packages/ui/src/styles.css`, pozostawienie stylów i kodu aplikacji `packages/app/` bez zmian.

---

## Etap 1. Fundamenty – co zrobiono i sprawdzono

1. **Konfiguracja Storybook 10.6.3 w `@basalt/ui`:**
   - Framework: `@storybook/react-vite` z Vite 8 i React 19.
   - Dodatki: `@storybook/addon-docs` z pluginem `remark-gfm` dla tabel MDX, `@storybook/addon-a11y` z `a11y: { test: 'error' }`, `@storybook/addon-vitest` z `@vitest/browser-playwright` (Chromium).
   - Branding i porządek: wyłączone onboarding checklisty i sprawdzanie nowych wersji, czysty motyw Basalt w managerze i dokumentacji.
2. **Trzy warstwy tokenów (`src/tokens/`):**
   - Warstwa 1 (`raw.css`): surowe szarości, błękity, akcenty, skala odstępów 4 px, stosy fontów, promienie, czasy animacji.
   - Warstwa 2 (`semantic.css` + `accents.css`): tokeny znaczeniowe (`--bs-surface-*`, `--bs-text-*`, `--bs-border-*`, `--bs-action-*`, `--bs-space-*`, `--bs-radius-*`, `--bs-motion-*`). Każdy token ma w komentarzu źródło (R01/R02/A01/WCAG/tokens.md).
   - Warstwa 3 (`component.css`): tokeny komponentowe (`--bs-titlebar-height`, `--bs-sidebar-width`, `--bs-tab-active-indicator`, `--bs-tree-selected-indicator`, itp.).
3. **Weryfikacja kontrastu:**
   - 50 testów jednostkowych w `src/tokens/contrast.test.ts` weryfikuje każdą parę tekst/tło (próg 4.5:1) i kontrolka/tło (próg 3:1) według WCAG 2.x bezpośrednio z plików CSS. Wszystkie używane pary spełniają wymagania.
4. **Integracja z Tailwind CSS v4:**
   - `@theme inline` w `theme.css` mapuje wyłącznie tokeny Basalt na klasy narzędziowe. Domyślne palety kolorów, promieni, cieni i odstępów Tailwinda zostały wyzerowane (`--color-*: initial` itd.).
   - Fonty: systemowy stos bez zewnętrznego CDN (zasada 9).
5. **Przełączniki w Storybooku (zasada 9):**
   - Przełącznik motywu ustawia `data-theme` na `<html>`, co gwarantuje poprawne stylowanie portali, dialogów i menu.
   - Przełącznik akcentu ustawia `data-accent` na `<html>` (Blue default, Green Obsidian, Amber, Purple).
6. **Strony Foundations w MDX (z blokami `Unstyled`):**
   - `Color.mdx` – role, palety, zasady WCAG i interaktywna zmierzona tabela kontrastu.
   - `Typography.mdx` – role typograficzne, skale, interlinie, szerokość tekstu ciągłego.
   - `Spacing and layout.mdx` – relacje przestrzenne w grupie, między grupami, wewnątrz panelu, między sekcjami oraz szerokości 320/768/1440 px.
   - `Shape and depth.mdx` – promienie 4 px / 8 px, zasada braku cieni i rozmyć (A01), separacja warstw kolorem i obrysem.
   - `Motion.mdx` – czasy 100/150 ms, brak sprężynowania, zerowanie przy `prefers-reduced-motion`.
   - `Icons.mdx` – Lucide outline, stała grubość kreski, reguły dostępności i rozmiary.
   - `Themes.mdx` – architektura ciemnego motywu, obsługa akcentów, informacja o jasnym motywie w backlogu.
7. **Narzędzia i skrypty weryfikacji:**
   - `scripts/check-tokens.ts` (`npm run check:tokens`) – skaner zakazanych literałów kolorów hex/rgb/hsl/oklch, domyślnych klas palety Tailwinda i arbitralnych wartości (`p-[13px]`). Zwraca kod 1 w razie naruszeń.
   - `scripts/test-stories-themes.mjs` (`npm run test:stories:themes`) – uruchamia stories w headless Chromium z testem a11y.
   - Skrypty w root `package.json` przekazują polecenia do `@basalt/ui`: `storybook`, `build-storybook`, `test:stories`, `test:stories:themes`, `check:tokens`.
8. **Wyniki testów weryfikacyjnych:**
   - `npm run check:tokens` -> **0 naruszeń** (czysto).
   - `npm run test:stories:themes` -> **9/9 testów browser/a11y PASS**.
   - `npm run test` (root) -> **61/61 testów jednostkowych PASS**.
   - `npm run lint` -> **0 błędów, 0 ostrzeżeń**.
   - `npm run typecheck` -> **0 błędów**.
   - `npm run build-storybook` -> **build zakończony sukcesem**.

---

## Etap 2. Komponenty bazowe – plan i różnice od bazy

Zgodnie z wymogiem Etapu 2, przed rozpoczęciem pierwszej partii przedstawiamy zestawienie, czym kształt, gęstość i stany komponentów różnią się od domyślnego shadcn:

### Partia 1: 6 komponentów bazowych
1. **Button** (primary, secondary, ghost, destructive)
2. **IconButton** (dedykowany komponent z wymaganym `aria-label` i tooltipem)
3. **TextLink** (link inline i standalone z akcentem)
4. **Input** (pole tekstowe jednolinijkowe)
5. **Label + Field** (etykieta, podpowiedź, stan błędu, oznaczenie wymagane/opcjonalne)
6. **Checkbox** (pole wyboru w edytorze zadań i opcjach)

### Partia 2: kolejne 6 komponentów bazowych
7. Select
8. Switch
9. Panel / Card (karta grupująca wiersze ustawień)
10. StatusIndicator (stan zapisu i synchronizacji)
11. Alert (bannery ostrzegawcze i informacyjne)
12. Skeleton (szkielet ładowania obrazu/danych)

### Partia 3: pozostałe komponenty bazowe
13. Dialog
14. ConfirmDialog
15. Menu (Dropdown / Context menu)
16. Popover (zatwierdzony przez właściciela)
17. RadioGroup (zatwierdzona przez właściciela)
18. Toast (zatwierdzony przez właściciela)
19. Tooltip
20. Tabs
21. EmptyState
22. ErrorState

### Zestawienie różnic Partii 1 od domyślnej bazy (shadcn/ui `new-york`)

| Cecha | Domyślny shadcn (`new-york`) | Basalt (`@basalt/ui`) | Decyzja / źródło |
|---|---|---|---|
| **Promienie (`radius`)** | `rounded-md` (6 px), `rounded-lg` (8 px), `rounded-xl` (12 px) na przyciskach | Tylko `radius-control` (4 px) dla kontrolek i `radius-container` (8 px) dla paneli | R01.12, R01.5, A01 (zakaz `rounded-2xl` i pigułek) |
| **Wysokość kontrolek** | `h-10` (40 px) domyślnie, `h-9` (36 px) małe | Zwarte `h-icon-button` (28 px) dla przycisków akcji, inputów i ikon | R01.7, R01.11, cel kliknięcia WCAG 2.5.8 (≥24 px) |
| **Cienie (`shadow`)** | `shadow-sm`, `shadow` na przyciskach i kartach | Całkowity brak cieni (`shadow: none`) | R01.1, A01 (płaski interfejs) |
| **Obramowania (`border`)** | Kontur `border-input`, pierścień `ring-offset-2` | Linie 1 px `border-divider` (`#2b2b2b`) dla podziału, `border-control` (`#787878`, 3:1) dla obrysów pól | R01.1, WCAG 1.4.11, tokeny.md |
| **Fokus z klawiatury** | `ring-2 ring-ring ring-offset-2` (często biały/szary) | `focus-ring` (2 px `blue-300`, odsunięcie 2 px `outline-offset-2`) na tle powierzchni | luka fokusu, propozycja zatwierdzona, kontrast 6.28:1 |
| **Kolorystyka akcji** | `bg-primary text-primary-foreground` (czarno-białe lub barwne tła z biblioteki) | Główny: `bg-action-primary` (akcent użytkownika, domyślnie `#006cbe`) + `text-on-accent` (`#ffffff`); Drugorzędny: `bg-button-secondary-bg` (`#262626`) + `border-divider` | R01.2, R02.3, R02.7, R01.5 |
| **Stan najechania (`hover`)** | Rozjaśnienie/ściemnienie przez `opacity` (`hover:bg-primary/90`) | Precyzyjna zmiana koloru tła: `action-primary-hover` (`#005fa8`) lub `state-hover` (`#262626`), bez skalowania | R01.12, M1, M2 |
| **Typografia kontrolek** | `text-sm` (14 px) font sans zmienny | `text-size-ui` (13 px, line-height 1.5) font systemowy | R01.10, R01.9 |
| **Odstępy wewnętrzne** | `px-4 py-2` (16 px / 8 px) | Zwarte odstępy relacyjne: `px-between-groups` (12 px) / `px-in-group` (8 px / 4 px) | R01.7, R02.1 |

---

## Dziennik

- **2026-10-25 (Etap 0):** Inwentaryzacja repozytorium, analiza referencji, tokenów i specyfikacji. Zgłoszenie 5 pytań do właściciela.
- **2026-10-25 (Decyzje):** Właściciel zatwierdził ciemny motyw (jasny do What is missing), dodanie Toast/RadioGroup/Popover, realizację wzorców jako propozycje, Vitest 5 w ui oraz zasady migracji istniejącego kodu.
- **2026-10-25 (Etap 1):** Zbudowano pełne fundamenty: Storybook 10.6.3 z a11y i Vitest browser runnerem, 3 warstwy tokenów CSS, Tailwind inline theme, przełączniki motywu i akcentu, 7 stron Foundations w MDX ze zmierzonym kontrastem, skrypt `check:tokens` weryfikujący zgodność z tokenami. Wszystkie testy (unit, a11y browser, checkTokens, lint, typecheck) zakończone sukcesem.


---

## Etap 2, Partia 1. Wykonane (2026-10-30)

Zbudowane: Button, IconButton, TextLink, Input, Label+Field, Checkbox (`src/components/`), stories z macierzą stanów i testami `play`, strony `docs/primitives/*.mdx` (13 sekcji), testy jednostkowe.

Wyniki: `check:tokens` 0 naruszeń, `test` 96/96, `test:stories:themes` 45/45 (motyw ciemny, a11y), `lint` 0, `typecheck` 0, `build-storybook` OK.

Znalezione i naprawione: `tailwind-merge` nie znał tokenów (gubił `text-size-ui`), kolejność warstw CSS (base nadpisywało utilities), brak resetu tła przycisku. Szczegóły: `.ai/lessons/2026-10-30-tailwind-merge-and-layer-order.md`.

### Propozycje do decyzji (pytania z `lekcja6/TODO.md`, przyjęte tymczasowo wg rekomendacji)
1. Button: nazwy Basalt + aliasy `default`/`outline` i rozmiar `lg` (zgodność z `packages/app/src/App.tsx`).
2. Rozmiar `lg` = 36 px (`activity-button`), tylko jako propozycja dla pojedynczej wyraźnej akcji.
3. Disabled: `text-muted` na `state-hover`, bez `opacity`.
4. IconButton: natywny `title` do czasu Tooltip (Partia 3).
5. Checkbox: pole 16 px w wierszu 28 px, bez stanu pośredniego.
6. Komponenty pisane ręcznie, bez CLI shadcn.
Dodatkowe propozycje: link `inline` zawsze podkreślony, `standalone` na hover; pole opcjonalne oznaczone „(optional)”, wymagane bez oznaczenia; hover linku i pola wyboru bez źródła w materiałach.

### Niesprawdzone
Szerokości 320/768/1440 px w przeglądarce poza stories „Narrow screen”, nawigacja klawiaturą po zbudowanych stronach, akcenty zielony/bursztynowy/fioletowy dla nowych komponentów, `npm run test:e2e`.


---

## Etap 2, Partia 2. Wykonane (2026-10-30)

Zbudowane: Select, Switch, Card (+ CardRow), StatusIndicator, Alert, Skeleton, ze stories (stany zamrożone, `play`, wąski ekran), testami jednostkowymi i stronami `docs/primitives/*.mdx` (13 sekcji).

Wyniki: `check:tokens` 0 naruszeń, `test` 121/121, `test:stories:themes` 70/70 (motyw ciemny, a11y), `lint` 0, `typecheck` 0, `build-storybook` OK.

Naprawione po drodze: brak resetu marginesów `p`, nagłówków, `figure`, `fieldset` (bez preflightu Tailwinda; dodany do `styles.css`); `status-danger` dodany do par kontrastu na `surface-card`, `state-hover`, `state-selected`.

### Propozycje do decyzji
1. Select to natywny `select` (bez nowej zależności); otwarta lista jest rysowana przez system i nie podlega tokenom.
2. Switch pisany ręcznie (`role="switch"`, bez `@radix-ui/react-switch`); rozmiary toru 36 x 20 px i kółka 16 px używają istniejących tokenów (`activity-button`, `activity-icon`, `icon`, `tab-indicator`), osobny token tylko jeśli rozmiary mają się rozjechać.
3. StatusIndicator: słowa „Sync conflict” i „Sync error” oraz ikony są propozycją (źródła: „Synced”, „Syncing”, błąd w `status-danger`); bez animacji ikony „Syncing”.
4. Alert: układ (ikona, tytuł, akcja) jest propozycją; źródła określają tylko kolory statusów. Bez przycisku zamknięcia.
5. Skeleton: bez animacji (brak źródła), próg 300 ms jest propozycją.
6. Card: nagłówek poza kontenerem, `headingAs` ustawia poziom; wiersz kontrolki zawija się pod tytuł poniżej 768 px.

### Niesprawdzone
Szerokości 320/768/1440 px w przeglądarce poza stories „Narrow screen”, nawigacja klawiaturą po stronach docs, akcenty zielony/bursztynowy/fioletowy, `npm run test:e2e`.


---

## Etap 2, Partia 3. Wykonane (2026-10-30)

Zbudowane: Tooltip, Dialog, ConfirmDialog, Menu (dropdown), Popover, RadioGroup, Toast (`ToastProvider` + `useToast`), Tabs, EmptyState, ErrorState, ze stories (`play`, wąski ekran), testami jednostkowymi i stronami `docs/primitives/*.mdx` (13 sekcji). IconButton używa teraz Tooltip zamiast natywnego `title` (rozstrzygnięte pytanie 4), z `tooltip={false}` dla przycisków zamykania.

Nowe zależności (Radix, wszystkie z zatwierdzonej listy komponentów): `react-dialog`, `react-dropdown-menu`, `react-popover`, `react-radio-group`, `react-tabs`, `react-toast`; `react-tooltip` przeniesiony z `devDependencies` do `dependencies`.

Wyniki: `check:tokens` 0 naruszeń, `test` 163/163, `test:stories:themes` 110/110 (motyw ciemny, a11y), `lint` 0, `typecheck` 0, `build-storybook` OK.

Znaleziska (szczegóły: `.ai/lessons/2026-10-30-radix-overlays-gotchas.md`): tooltip otwierał się na autofokusie przycisku zamykania dialogu; `state-hover` = `surface-raised`, więc podświetlenie pozycji menu używa `state-selected`; modalne menu psuło a11y (`modal={false}`).

### Propozycje do decyzji
1. Zasłona (scrim) dialogu: `surface-frame` z `opacity-80`; brak w źródłach.
2. Dialog nie przewija zawartości wyższej niż ekran (do rozważenia przy pierwszym długim dialogu).
3. Menu: tylko dropdown. Menu kontekstowe (prawy przycisk) nie zbudowane, czeka na drugie użycie (drzewo plików); do „What is missing”. Menu nazywa trigger, nie osobna etykieta.
4. Tooltip: opóźnienie 400 ms; bez strzałki.
5. Toast: tylko wariant neutralny, jedna akcja, 5 s, pozycja prawy dolny róg / pełna szerokość na 320 px; błędy wymagające działania celowo poza toastem.
6. RadioGroup: kółko 16 px z kropką 4 px (`rounded-switch` jako jedyny drugi pełny promień); tylko układ pionowy.
7. Tabs: tylko poziome, wskaźnik 2 px `tab-indicator` w `action-primary`.
8. ConfirmDialog: fokus na „Cancel”, Escape nie potwierdza; wzorzec jest propozycją dla E01-S04.
9. EmptyState wyrównany do lewej (nie wyśrodkowany, A01); ErrorState z opcjonalnym blokiem szczegółów technicznych.
10. Dokumentacja Dialog/Menu/Popover/Tabs itd. ma w sekcji 12 listę zasad zamiast par „dobrze/źle”, gdzie para wymagałaby otwartej nakładki.

### Niesprawdzone
Szerokości 320/768/1440 px w przeglądarce poza stories „Narrow screen”, nawigacja klawiaturą po zbudowanych stronach docs, akcenty zielony/bursztynowy/fioletowy, czytniki ekranu (tylko role i nazwy z testów), `npm run test:e2e`.
