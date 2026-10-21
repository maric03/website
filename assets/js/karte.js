// Lädt die Google-Maps-Karte erst, wenn auf "Karte laden" geklickt wird.
// Vorher werden keine Daten an Google übertragen.
document.querySelectorAll('.map-consent').forEach(function (box) {
  box.querySelector('.map-consent-button').addEventListener('click', function () {
    var iframe = document.createElement('iframe');
    iframe.title = 'Karte Fabelhafte Funde';
    iframe.src = box.getAttribute('data-map-src');
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    box.replaceWith(iframe);
  });
});
