// Mobiles Menü: Auf kleinen Bildschirmen wird die Navigation über den Button "Menü" auf- und zugeklappt.
// Ohne JavaScript bleibt die Navigation einfach sichtbar.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  var button = document.querySelector('.nav-toggle');
  var nav = document.getElementById('hauptnavigation');
  if (!button || !nav) return;

  function setzeOffen(offen) {
    button.setAttribute('aria-expanded', String(offen));
    button.querySelector('.nav-toggle-label').textContent = offen ? 'Schließen' : 'Menü';
    nav.classList.toggle('is-open', offen);
  }

  button.addEventListener('click', function () {
    setzeOffen(button.getAttribute('aria-expanded') !== 'true');
  });

  // Nach einem Klick auf einen Link (z. B. Sprung innerhalb der Seite) wieder schließen
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setzeOffen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setzeOffen(false);
      button.focus();
    }
  });
});
