# Neue Fotos auf die Website stellen

Die Galerie „Unsere Arbeiten“ holt sich ihre Fotos automatisch. Neue Bilder erscheinen ohne Programmieren, etwa eine Minute nach dem Hochladen.

## So geht's (auch am Handy)

1. **Verwaltungsseite öffnen:** **https://www.tischlerei-ochenbauer.at/fotos.html**.
   Tipp: Am Handy als Lesezeichen oder „Zum Home-Bildschirm“ speichern.
2. **Anmelden** mit E-Mail-Adresse und Passwort.
3. **Kategorie wählen**, z. B. „Küche“.
4. **„Fotos auswählen“** antippen und ein oder mehrere Fotos aus der Galerie des Handys wählen.
5. **„Hochladen“** drücken und warten, bis bei jedem Foto „fertig“ steht.

Die Fotos werden vorher automatisch verkleinert (ein 5-MB-Handyfoto wird zu rund 200 KB). Die Website bleibt also schnell, egal wie groß das Original ist.

## Galerie ordnen

Unter **„Galerie ordnen“**:

| Aktion | So geht's |
| --- | --- |
| Reihenfolge ändern | Pfeile ↑ ↓ neben der Kategorie. Die **oberste** Kategorie wird auf der Website groß angezeigt. |
| Titelbild wählen | „Fotos anzeigen“ → **Stern** beim gewünschten Foto |
| Foto löschen | „Fotos anzeigen“ → **Papierkorb** |
| Kategorie umbenennen | Auf den Namen tippen und überschreiben |
| Kategorie ausblenden | Durchgestrichenes Auge (die Fotos bleiben gespeichert) |
| Neue Kategorie | „Neue Kategorie“ → Namen eingeben → Fotos hochladen |

Leere Kategorien erscheinen nicht auf der Website.

## Passwort vergessen?

Auf der Anmeldeseite E-Mail-Adresse eingeben und „Passwort vergessen?“ antippen. Danach kommt eine E-Mail mit einem Link zum Zurücksetzen.

---

## Einmalige Einrichtung (technisch, nur einmal nötig)

1. ✅ *Erledigt am 26.10.2026.* Im Supabase-Projekt **„tischlerei-bilder“** → **SQL Editor** den Inhalt von [`supabase/foto-admin.sql`](supabase/foto-admin.sql) einfügen und **Run** drücken.
   Das erlaubt Hochladen und Löschen nur für freigegebene E-Mail-Adressen. Freigegeben ist `tischlerei.ochenbauer@gmail.com`; weitere Adressen kommen unten im SQL dazu.
2. **Authentication → Users → Add user**: E-Mail und Passwort eintragen, Haken bei **„Auto Confirm User“**.
3. Für „Passwort vergessen“: **Authentication → URL Configuration** → bei *Redirect URLs* **https://www.tischlerei-ochenbauer.at/fotos.html** eintragen.

### Wie es technisch funktioniert

- Fotos liegen im öffentlichen Supabase-Bucket `bilder`, **ein Ordner pro Kategorie**.
- Zu jedem hochgeladenen Foto gibt es ein kleines Vorschaubild (`…__thumb.webp`) für die Galerie-Kacheln.
- Reihenfolge, Namen, Titelbilder und ausgeblendete Kategorien stehen in `bilder/_kategorien.json`. Die Datei wird beim ersten Speichern in der Verwaltung angelegt. Solange es sie nicht gibt, erkennt die Website die Ordner selbst.
- Die Ordner `Logo` und `Portrait` gehören nicht zur Galerie.
- Code: `galerie.js` (gemeinsame Datenlogik), `script.js` (Website), `fotos.html` / `fotos.js` / `fotos.css` (Verwaltung).
