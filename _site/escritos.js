(function () {
  var list = document.getElementById('escritos-list');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.escrito-card'));
  var topicButtons = Array.prototype.slice.call(document.querySelectorAll('.chip-topic'));
  var typeButtons = Array.prototype.slice.call(document.querySelectorAll('.chip-type'));
  var countEl = document.getElementById('escritos-count');
  var emptyEl = document.getElementById('escritos-empty');
  var allTopicBtn = document.querySelector('.chip-topic[data-topic="all"]');

  var activeTopics = {};          // set of selected topic slugs; empty = all
  var activeType = 'all';

  function topicCount() {
    return Object.keys(activeTopics).length;
  }

  function apply() {
    var shown = 0;
    var hasTopicFilter = topicCount() > 0;
    cards.forEach(function (card) {
      var cardType = card.getAttribute('data-type');
      var cardTopics = (card.getAttribute('data-topics') || '').split(/\s+/);
      var typeOk = activeType === 'all' || cardType === activeType;
      var topicOk = !hasTopicFilter || cardTopics.some(function (t) { return activeTopics[t]; });
      var visible = typeOk && topicOk;
      card.hidden = !visible;
      if (visible) shown++;
    });
    countEl.textContent = shown + (shown === 1 ? ' escrito' : ' escritos');
    emptyEl.hidden = shown !== 0;
  }

  topicButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var topic = btn.getAttribute('data-topic');
      if (topic === 'all') {
        activeTopics = {};
        topicButtons.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-topic') === 'all');
        });
      } else {
        if (activeTopics[topic]) {
          delete activeTopics[topic];
          btn.classList.remove('is-active');
        } else {
          activeTopics[topic] = true;
          btn.classList.add('is-active');
        }
        if (allTopicBtn) allTopicBtn.classList.toggle('is-active', topicCount() === 0);
      }
      apply();
    });
  });

  typeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeType = btn.getAttribute('data-type');
      typeButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      apply();
    });
  });

  apply();
})();
