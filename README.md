# Fabelhafte Funde – Website

Website des Secondhand-Ladens Fabelhafte Funde in Ubstadt-Weiher, veröffentlicht über GitHub Pages unter [fabelhaftefunde.de](https://fabelhaftefunde.de).

## Aufbau

```
index.html                 Startseite
galerie.html               Sortiment & Galerie
kontakt.html               Kontakt, Impressum, Datenschutz
oeffnungszeiten/index.html Öffnungszeiten und Sondertermine

assets/
  css/style.css            gesamtes Design
  js/menu.js               Menü auf dem Handy
  js/karte.js              Google Maps erst nach Klick laden
  js/oeffnungszeiten.js    Live-Status und Sondertermine
  fonts/                   lokal eingebundene Schriften (mit Lizenzen)
  img/                     Logo und Foto für die strukturierten Daten
  img/hero/                Hintergrundbilder der Seitenköpfe
  img/icons/               Icons der Sortiments-Kacheln
  img/galerie/             Galeriebilder, benannt nach Kategorie (z. B. frauen-01.jpeg)

daten/sonderzeiten.json    Sondertermine – wird über Pages CMS gepflegt
.pages.yml                 Einstellungen für Pages CMS
CNAME                      eigene Domain für GitHub Pages
```

## Neue Galeriebilder

Bild in `assets/img/galerie/` ablegen, nach dem Schema `kategorie-nummer.jpeg` benennen (Kategorien: `frauen`, `maenner`, `kinder`, `haushalt`) und in `galerie.html` im passenden Abschnitt eintragen.
