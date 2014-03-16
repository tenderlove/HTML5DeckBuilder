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
      table.addCard(card, e.target.getAttribute('data-type'));
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
  this.clearCharts();
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

Table.prototype.setDeck = function(deck) {
  var thing = this;
  for (var section in this.cardColumns) {
    var column = this.cardColumns[section];

    deck[section].forEach(function(card) {
      thing.addCardToTarget(card, column);
    });
  }
  this.alignImages();
  this.drawCharts();
};

Table.prototype.addCard = function(card, loc) {
  var thing = this.cardColumns[loc];
  this.addCardToTarget(card, thing);
  this.alignImages();
  this.drawCharts();
};

Table.prototype.manaDistribution = function() {
  var group = {};
  this.cards().forEach(function(card) {
    group[card.cmc] = (group[card.cmc] || 0) + 1;
  });
  return Object.keys(group).map(Number).sort().map(function(num) {
    return [num, group[num]];
  });
}

Table.prototype.isEmpty = function() {
  return this.cards().length == 0;
}

Table.prototype.symbolDistribution = function() {
  var group = {};
  this.cards().forEach(function(card) {
    if(card.manaCost) {
      var symbols = card.manaCost.match(/{([^}]*)}/g).map(function(t) {
        return /{([^}]*)}/.exec(t)[1];
      }).filter(function (t) { return /^[RBUGW]$/.exec(t); })

      symbols.forEach(function (sym) {
        group[sym] = (group[sym] || 0) + 1;
      });
    }
  });
  return Object.keys(group).map(function(key) { return [key, group[key]]; });
}

Table.prototype.colorDistribution = function() {
  var group = {};
  this.cards().forEach(function(card) {
    if(card.colors) {
      if(card.colors.length > 1) {
        group['Gold'] = (group['Gold'] || 0) + 1;
      } else {
        var color = card.colors[0];
        group[color] = (group[color] || 0) + 1;
      }
    }
  });
  return Object.keys(group).map(function(key) { return [key, group[key]]; });
}

Table.prototype.cardTypeDistribution = function() {
  var group = {};
  this.cards().forEach(function(card) {
    if(card.types) {
      card.types.forEach(function(type) {
        group[type] = (group[type] || 0) + 1;
      });
    }
  });
  return Object.keys(group).map(function(key) { return [key, group[key]]; });
}

Table.prototype.factorial = function(x) {
  var f = 1;
  for(var i = 1; i < x; i++) {
    f = f * i;
  }
  return f;
};

// Binomial Coefficient
Table.prototype.C = function(n, k) {
  return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
};

Table.prototype.HYPGEOMDIST = function(k, n, K, N) {
  return this.C(K, k) * this.C(N - K, n - k) / this.C(N, n);
};

Table.prototype.firstHandProbability = function() {
  var cards = this.cards();

  if (cards.length < 7) { return []; }

  var group = {};
  cards.forEach(function(card) {
    group[card.name] = (group[card.name] || 0) + 1;
  });

  var deck = this;
  // get 0, 7 drawn, 4 possible, 60 deck
  // HYPGEOMDIST(0, 7, 4, 60)
  return Object.keys(group).map(function(key) {
    // Calculate the probability of drawing *none*, then subtract from 100%
    return [key, 1 - deck.HYPGEOMDIST(0, 7, group[key], cards.length)];
  }).sort(function(a,b) { return a[1] < b[1]; });
};

Table.prototype.cards = function() {
  var deck = this;
  return this.rowTypes.reduce(function(prev, curr) {
    return prev.concat(deck[curr]());
  }, []);
}

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
    deck.addCard(card, column.getAttribute('data-type'));
    deck.alignImages();
    return false;
  }, false);
  $(div).append(img);
  loc.append(div);
}

Table.prototype.isMember = function(img) {
  return $(img).parents("div.deck")[0];
}

Table.prototype.clearCharts = function() {
  ['manacurve', 'colordist', 'manacurve', 'symboldist'].forEach(function(type) {
    var node = document.getElementById(type);
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  });
  this.clearProbability();
};

Table.prototype.clearProbability = function() {
  var node = document.getElementById('firsthandlist');
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

Table.prototype.drawCharts = function() {
  if (this.cards().length == 0) {
    this.clearCharts();
  } else {
    drawManaCurve(this);
    drawColorDistribution(this);
    drawSymbolDistribution(this);
    drawCardTypeDistribution(this);
    this.clearProbability();
    drawFirstHandProbability(this);
  }
}

Table.prototype.removeCard = function(img) {
  var div = img.parentNode;
  div.parentNode.removeChild(div);
  this.alignImages();
  this.drawCharts();
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
