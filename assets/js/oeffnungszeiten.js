/*
  Öffnungszeiten – Live-Status und Sondertermine
  ------------------------------------------------
  Reguläre Öffnungszeiten: unten in REGULAER.
  Sondertermine pflegt ihr im Pages CMS unter "Sonderöffnungszeiten"
  (gespeichert in /daten/sonderzeiten.json).

  Das Skript füllt automatisch:
  - [data-live-status]   → "Heute geöffnet bis 16 Uhr" / "Nächster Öffnungstag: …"
  - [data-sondertermin]  → der nächste anstehende Sondertermin
  - #oeffnungszeiten-body → Tabelle aller anstehenden Sondertermine
  Ohne JavaScript bleibt der Hinweis "Jeden Samstag 11–16 Uhr" stehen.
*/
(function () {
  'use strict';

  var ZEITZONE = 'Europe/Berlin';
  // 0 = Sonntag, 1 = Montag … 6 = Samstag
  var REGULAER = { 6: { von: '11:00', bis: '16:00' } };
  var WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  // ---------- Datum & Zeit (immer deutsche Zeit) ----------

  function jetztInDeutschland() {
    var teile = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZEITZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (t) { teile[t.type] = t.value; });
    return {
      datum: teile.year + '-' + teile.month + '-' + teile.day,
      minuten: Number(teile.hour) * 60 + Number(teile.minute)
    };
  }

  function alsDatum(iso) {
    var p = iso.split('-');
    return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])));
  }
  function plusTage(iso, n) {
    var d = alsDatum(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function wochentag(iso) { return alsDatum(iso).getUTCDay(); }
  function inMinuten(hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function uhrzeit(hhmm) { var p = hhmm.split(':'); return Number(p[0]) + (p[1] !== '00' ? ':' + p[1] : ''); }
  function zeitraum(z) { return uhrzeit(z.von) + '–' + uhrzeit(z.bis) + ' Uhr'; }
  function kurzesDatum(iso) { var p = iso.split('-'); return p[2] + '.' + p[1] + '.'; }
  function langesDatum(iso) { return WOCHENTAGE[wochentag(iso)] + ', ' + kurzesDatum(iso); }

  // ---------- Sondertermine ----------

  var GUELTIGES_DATUM = /^\d{4}-\d{2}-\d{2}$/;
  var GUELTIGE_UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

  function bereinigen(liste) {
    if (!Array.isArray(liste)) return [];
    return liste
      .filter(function (t) { return t && GUELTIGES_DATUM.test(t.von || ''); })
      .map(function (t) {
        var bis = GUELTIGES_DATUM.test(t.bis || '') && t.bis >= t.von ? t.bis : t.von;
        var mitZeit = GUELTIGE_UHRZEIT.test(t.uhrzeit_von || '') && GUELTIGE_UHRZEIT.test(t.uhrzeit_bis || '');
        return {
          von: t.von,
          bis: bis,
          status: String(t.status || '').trim() || 'Sondertermin',
          zeit: mitZeit ? { von: t.uhrzeit_von, bis: t.uhrzeit_bis } : null,
          hinweis: String(t.hinweis || '').trim()
        };
      })
      .sort(function (a, b) { return a.von < b.von ? -1 : a.von > b.von ? 1 : 0; });
  }

  function terminAm(termine, iso) {
    // Bei Überschneidungen hat "Geschlossen" Vorrang
    var treffer = termine.filter(function (t) { return t.von <= iso && t.bis >= iso; });
    return treffer.filter(function (t) { return t.status === 'Geschlossen'; })[0] || treffer[0] || null;
  }

  function zeitenAm(termine, iso) {
    var t = terminAm(termine, iso);
    if (t && t.status === 'Geschlossen') return null;
    if (t && t.zeit) return t.zeit;
    if (t && t.status === 'Sonderöffnung') return REGULAER[6];
    return REGULAER[wochentag(iso)] || null;
  }

  // ---------- Texte ----------

  function liveStatus(termine, jetzt) {
    var heute = zeitenAm(termine, jetzt.datum);
    if (heute && jetzt.minuten < inMinuten(heute.von)) {
      return { offen: true, titel: 'Heute geöffnet', text: zeitraum(heute) };
    }
    if (heute && jetzt.minuten < inMinuten(heute.bis)) {
      return { offen: true, titel: 'Heute geöffnet', text: 'bis ' + uhrzeit(heute.bis) + ' Uhr' };
    }
    for (var i = 1; i <= 400; i++) {
      var tag = plusTage(jetzt.datum, i);
      var z = zeitenAm(termine, tag);
      if (z) {
        return {
          offen: false,
          titel: heute ? 'Jetzt geschlossen ·' : 'Heute geschlossen ·',
          text: 'Nächster Öffnungstag: ' + (i === 1 ? 'morgen, ' + kurzesDatum(tag) : langesDatum(tag)) + ', ' + zeitraum(z)
        };
      }
    }
    return null;
  }

  function terminDatum(t) {
    return t.von === t.bis ? langesDatum(t.von) : langesDatum(t.von) + ' bis ' + langesDatum(t.bis);
  }
  function terminDetails(t) {
    var teile = [];
    if (t.zeit) teile.push(zeitraum(t.zeit));
    if (t.hinweis) teile.push(t.hinweis);
    return teile.join(' · ');
  }

  // ---------- Anzeige ----------

  function zeigeStatus(termine, jetzt) {
    var s = liveStatus(termine, jetzt);
    document.querySelectorAll('[data-live-status]').forEach(function (el) {
      if (!s) return;
      var text = el.querySelector('.live-status-text');
      var fett = document.createElement('strong');
      fett.textContent = s.titel;
      text.replaceChildren(fett, document.createTextNode(' ' + s.text));
      el.classList.toggle('is-open', s.offen);
      el.classList.toggle('is-closed', !s.offen);
    });
  }

  function zeigeNaechstenTermin(termine, jetzt) {
    var naechster = termine.filter(function (t) { return t.bis >= jetzt.datum; })[0];
    document.querySelectorAll('[data-sondertermin]').forEach(function (el) {
      if (!naechster) { el.hidden = true; return; }
      var text = el.querySelector('.sondertermin-text');
      var fett = document.createElement('strong');
      fett.textContent = 'Sondertermin:';
      var details = terminDetails(naechster);
      var status = naechster.status + (details ? ' (' + details + ')' : '');
      // Große Ansicht: alles in einer Zeile
      text.replaceChildren(fett, document.createTextNode(' ' + terminDatum(naechster) + ' – ' + status));
      // Handy: dieselben Angaben untereinander (wird per CSS nur mobil angezeigt)
      var mobil = el.querySelector('.sondertermin-mobil');
      if (!mobil) {
        mobil = document.createElement('span');
        mobil.className = 'sondertermin-mobil';
        text.after(mobil);
      }
      mobil.replaceChildren.apply(mobil, ['Sondertermin:', terminDatum(naechster), status].map(function (inhalt, i) {
        var zeile = document.createElement(i === 0 ? 'strong' : 'span');
        zeile.textContent = inhalt;
        return zeile;
      }));
      el.hidden = false;
    });
  }

  function zeigeTabelle(termine, jetzt) {
    var tbody = document.getElementById('oeffnungszeiten-body');
    if (!tbody) return;
    var kommende = termine.filter(function (t) { return t.bis >= jetzt.datum; });
    tbody.replaceChildren();
    if (!kommende.length) {
      var leer = document.createElement('tr');
      var zelle = document.createElement('td');
      zelle.colSpan = 3;
      zelle.className = 'termine-leer';
      zelle.textContent = 'Aktuell keine Sondertermine – es gelten die regulären Öffnungszeiten.';
      leer.appendChild(zelle);
      tbody.appendChild(leer);
      return;
    }
    kommende.forEach(function (t) {
      var zeile = document.createElement('tr');
      [terminDatum(t), t.status, terminDetails(t)].forEach(function (inhalt) {
        var td = document.createElement('td');
        td.textContent = inhalt || '–';
        if (!inhalt) td.className = 'leer';
        zeile.appendChild(td);
      });
      tbody.appendChild(zeile);
    });
  }

  function anzeigen(termine) {
    var jetzt = jetztInDeutschland();
    zeigeStatus(termine, jetzt);
    zeigeNaechstenTermin(termine, jetzt);
    zeigeTabelle(termine, jetzt);
  }

  fetch('/daten/sonderzeiten.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (daten) { anzeigen(bereinigen(daten)); })
    .catch(function () { anzeigen([]); });
})();
