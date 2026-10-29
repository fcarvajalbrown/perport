(function () {
  var cards = document.querySelectorAll('.work-card');
  cards.forEach(function (card) {
    card.addEventListener('click', function (event) {
      if (event.target.closest('a')) return;
      card.classList.toggle('is-flipped');
    });
  });
})();
