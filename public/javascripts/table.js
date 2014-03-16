function Table(root) {
  this.root = root;
}

Table.prototype.rowTypes =
    ["creatures", "spells", "artifacts", "enchantments", "lands", "planeswalkers"];

Table.prototype.rowTypes.forEach(function(thing) {
  Table.prototype[thing] = function() {
    return $("div." + thing + " img", this.root).map(function() {
      return jQuery.data(this, "card");
    }).toArray();
  }
});

Table.prototype.clear = function() {
  this.rowTypes.forEach(function(type) {
    var node = $("div." + type, this.root)[0];
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  });
};

Table.prototype.handleDragStart = function(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
};

Table.prototype.handleDragEnd = function(e) {
  this.style.opacity = '1.0';
};

Table.prototype.handleDragOver = function(e) {
  if (e.preventDefault) { e.preventDefault(); }
  return false;
};

Table.prototype.addCard = function(card, loc) {
  var div = document.createElement('div');
  var img = document.createElement('img');
  var deck = this;

  div.className = "card";
  img.src = card.imgUrl;
  img.setAttribute("draggable", true);
  jQuery.data(img, "card", card);
  img.addEventListener('dragstart', this.handleDragStart, false);
  img.addEventListener('dragend', this.handleDragEnd, false);
  img.addEventListener('dragover', this.handleDragOver, false);
  img.addEventListener('drop', function(e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    var card = jQuery.data(dragSrcEl, "card");
    var column = e.target.parentNode.parentNode;
    if(deck.isMember(dragSrcEl)) {
      deck.removeCard(dragSrcEl);
    }
    deck.addCard(card, $(column));
    alignImages();
    return false;
  }, false);
  $(div).append(img);
  loc.append(div);
  alignImages();
}

Table.prototype.isMember = function(img) {
  return $(img).parents("div.deck")[0];
}

Table.prototype.removeCard = function(img) {
  var div = img.parentNode;
  div.parentNode.removeChild(div);
  alignImages();
}
