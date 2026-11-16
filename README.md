# Pacepresso TTT-Planer

Zugplan für das Mannschaftszeitfahren (ZRL/WTRL) auf Zwift, auf Deutsch.
Die Berechnung macht die [ZwiftGopher TTT API](https://zwiftgopher.com/api/dashboard.php), derselbe Optimierer wie im TTT-Rechner von Dave Edmonds.

- Kader von der Teamseite vorbelegt, Fahrer pro Rennen auswählen (2–8, ZRL: 4–6)
- Rennen aus dem Kalender oder freie Strecke, Intensität, Effizienz, Finisher, Zugzeiten, Effort pro Fahrer, Vorgaben pro Fahrer
- Ergebnis mit Zugzeiten, Watt, IF, Windschatten-Leistungen, Ermüdung und W′-Reserve
- Plan von Hand bearbeiten und neu bewerten, Bild für den Team-Chat, Link in den Originalrechner
- Plan-Link: zeigt genau diesen Plan, ohne API-Key

Der API-Key steht nicht im Repo. Er kommt über den Team-Link (`#key=…`) und bleibt nur im jeweiligen Browser gespeichert.

Statische Seite ohne Build: `index.html`, `style.css`, `app.js`, `data.js`.
