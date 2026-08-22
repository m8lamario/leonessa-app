# Leonessa Pulse — App Launch Animation

## Obiettivo

Creare una breve animazione di apertura dell'app Leonessa, visibile all'avvio reale dell'app, con un effetto premium e sportivo.

L'animazione deve migliorare la percezione di caricamento senza rallentare l'accesso alla Dashboard.

## Concept

Logo Leonessa al centro dello schermo.

Animazione:

1. Logo entra con `scale + fade`.
2. Leggero pulse del logo.
3. Breve effetto glow/linea circolare.
4. Nome "LEONESSA" compare con un leggero fade-up.
5. Transizione morbida verso la Dashboard.

Durata target: **600–900 ms**.

## Comportamento

- Mostrare l'animazione solo durante il vero avvio dell'app.
- Non mostrarla durante la navigazione interna.
- Non bloccare inutilmente l'app se il caricamento è già terminato.
- Se l'app è pronta prima della fine dell'animazione, completare rapidamente la transizione.
- Evitare flash bianchi o schermate vuote.

## Mobile / Capacitor

La schermata deve funzionare correttamente su:

- Android
- iOS
- Web

Gestire correttamente:

- safe area;
- diverse dimensioni dello schermo;
- orientamento mobile;
- background;
- transizione dalla splash nativa alla UI React.

Evitare doppie splash o flash tra splash nativa Capacitor e Leonessa Pulse.

## Performance

- Animare principalmente `transform` e `opacity`.
- Nessuna animazione pesante.
- Nessun caricamento di asset non necessario.
- Non ritardare artificialmente l'apertura dell'app.
- Rispettare `prefers-reduced-motion`.

## Architettura

Creare una componente dedicata e riutilizzabile, ad esempio:

`LeonessaPulse`

La logica di avvio deve essere separata dalla Dashboard.

Non inserire l'animazione direttamente nel componente Dashboard.

## Transizione finale

La Dashboard deve apparire con una transizione molto breve e naturale:

```text
Leonessa Pulse
      ↓
fade/scale out
      ↓
Dashboard
```

Nessun effetto eccessivo.

## Criteri di completamento

- Logo centrato correttamente.
- Animazione fluida.
- Durata circa 600–900 ms.
- Nessun layout shift.
- Nessun flash bianco/nero indesiderato.
- Non ricompare durante la navigazione.
- Funziona su Web e Capacitor.
- Non peggiora il tempo percepito di apertura.
- `prefers-reduced-motion` rispettato.
- Typecheck ✅
- Lint ✅
- Build ✅

**La parte più importante:** non farla diventare una schermata di caricamento artificiale. Deve dare l'impressione che **Leonessa stia entrando in scena**, non che l'app stia aspettando di caricarsi.