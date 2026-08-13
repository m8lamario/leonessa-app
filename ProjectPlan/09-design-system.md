\# Leonessa App

\## Design System v1.0



\---



\# 1. Obiettivo



Definire tutti i componenti UI standard della piattaforma.



Ogni schermata deve essere costruita esclusivamente utilizzando questi componenti.



Benefici:



\- Consistenza visiva

\- Sviluppo più rapido

\- Manutenzione semplice

\- Migliore UX



\---



\# 2. Design Tokens



\## Colors



\### Primary



```css

\--color-primary: #0D1B60;

\--color-primary-hover: #162983;

\--color-primary-light: #305CFF;

```



\### Background



```css

\--bg-primary: #071034;

\--bg-secondary: #0F173F;

\--bg-card: #131E52;

```



\### Text



```css

\--text-primary: #FFFFFF;

\--text-secondary: #C6CCDA;

\--text-muted: #8D95A6;

```



\### Status



```css

\--success: #16A34A;

\--warning: #F59E0B;

\--danger: #DC2626;

\--info: #2563EB;

```



\---



\# 3. Spacing



```css

4px

8px

12px

16px

24px

32px

48px

64px

```



\---



\# 4. Border Radius



```css

sm: 8px

md: 16px

lg: 24px

xl: 32px

```



\---



\# 5. Typography



\## Display



48px / 700



\## H1



32px / 700



\## H2



24px / 600



\## H3



20px / 600



\## Body



16px / 400



\## Small



14px / 400



\---



\# 6. Buttons



\## Primary Button



Utilizzo:



\- CTA principali



Esempi:



```text

Registrati

Partecipa

Riscatta Premio

```



\---



\## Secondary Button



Utilizzo:



\- Azioni meno importanti



\---



\## Ghost Button



Utilizzo:



\- Azioni contestuali



\---



\## Icon Button



Utilizzo:



\- Menu

\- Azioni rapide



\---



\# 7. Cards



\## Match Card



Campi:



\- Squadra casa

\- Squadra ospite

\- Risultato

\- Data

\- Stato



\---



\## School Card



Campi:



\- Logo

\- Nome

\- Ranking

\- Punti



\---



\## Mission Card



Campi:



\- Titolo

\- Ricompensa

\- Progresso



\---



\## Reward Card



Campi:



\- Premio

\- Costo

\- Disponibilità



\---



\## News Card



Campi:



\- Immagine

\- Titolo

\- Data



\---



\# 8. Inputs



\## Text Input



Campi standard.



\---



\## Search Input



Ricerca globale.



\---



\## Select



Scuola

Ruolo

Competizione



\---



\## Checkbox



Consensi.



\---



\## Toggle



Impostazioni.



\---



\# 9. Navigation



\## Bottom Navigation



```text

Home

Cup

Community

Rewards

Profile

```



\---



\## Top Navigation



\- Back Button

\- Titolo

\- Action Button



\---



\# 10. Feedback Components



\## Toast



Tipologie:



\- Success

\- Warning

\- Error

\- Info



\---



\## Modal



Per azioni importanti.



\---



\## Dialog



Conferme rapide.



\---



\# 11. Skeleton Loading



Tutte le schermate devono avere skeleton.



Mai spinner a schermo vuoto.



\---



\# 12. Empty States



Ogni sezione deve avere:



\- Icona

\- Titolo

\- Descrizione

\- CTA



\---



\# 13. Ranking Components



\## Ranking Row



Campi:



\- Posizione

\- Avatar

\- Nome

\- Punti



\---



\# 14. Gamification Components



\## XP Progress



Barra avanzamento livello.



\---



\## Badge Card



Visualizzazione badge.



\---



\## Achievement Modal



Popup ottenimento badge.



\---



\# 15. Match Center Components



\## Scoreboard



Elemento principale.



\---



\## Timeline



Goal

Assist

Cartellini

MVP



\---



\## Statistics Card



Statistiche partita.



\---



\# 16. Accessibility



Minimo touch area:



```css

44x44

```



Contrasto:



```text

WCAG AA

```



\---



\# 17. Regola Fondamentale



Se un componente viene creato due volte:



→ va inserito nel Design System.

