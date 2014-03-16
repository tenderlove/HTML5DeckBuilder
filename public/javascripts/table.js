function Table(root) {
  this.root = root;
  var cols = root.querySelectorAll("div.boardlist > div");
  var table = this;

  // Drop cards in particular columns
  [].forEach.call(cols, function(col) {
    col.addEventListener('dragover', handleDragOver, false);
    col.addEventListener('drop', function(e) {
      if (e.stopPropagation) { e.stopPropagation(); }
      var card = jQuery.data(dragSrcEl, "card");
      if (table.isMember(dragSrcEl)) {
        table.removeCard(dragSrcEl);
      }
      table.addCardToTarget(card, $(e.target));
      return false;
    }, false);
  });

  var cardColumns = {};
  
  this.rowTypes.forEach(function(type) {
    cardColumns[type] = $("div." + type);
  });
  this.cardColumns = cardColumns;
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
  var thing = this.cardColumns[loc];
  return this.addCardToTarget(card, thing);
};

Table.prototype.addCardToTarget = function(card, loc) {
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
    deck.addCardToTarget(card, $(column));
    deck.alignImages();
    return false;
  }, false);
  $(div).append(img);
  loc.append(div);
  this.alignImages();
}

Table.prototype.isMember = function(img) {
  return $(img).parents("div.deck")[0];
}

Table.prototype.removeCard = function(img) {
  var div = img.parentNode;
  div.parentNode.removeChild(div);
  this.alignImages();
}

Table.prototype.alignImages = function() {
  var maxidx = 0;
  var arr = Array.prototype.slice.call($(".deck .boardlist")[0].children);
  arr.forEach(function (div) {
    var arr2 = Array.prototype.slice.call(div.children);
    arr2.forEach(function (img, idx) {
      if (maxidx < idx) {
        maxidx = idx;
      }
      var pos = (idx * 25) + "px"
      $(img).css({ "position": "absolute",
                   "top": pos });
    });
  });
  var height = maxidx * 25 + 180;
  if (height < 500) {
    height = 500;
  }
  $("div.boardlist").css({"height": height + "px"});
}
