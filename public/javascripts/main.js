var dragSrcEl = null;

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

function alignImages() {
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

function handleDragOver(e) {
  if (e.preventDefault) { e.preventDefault(); }
  return false;
}

function addOne(deck) {
  var option = $("#cardlist option:selected")[0];
  var card = jQuery.data(option, 'card');

  var types = [
    ["Planeswalker", "div.planeswalkers"],
    ["Creature",     "div.creatures"],
    ["Artifact",     "div.artifacts"],
    ["Enchantment",  "div.enchantments"],
    ["Land",         "div.lands"],
  ]

  for(var i = 0; i < types.length; i++) {
    if (card.types.indexOf(types[i][0]) >= 0) {
      deck.addCard(card, $(types[i][1]));
      return false;
    }
  }

  deck.addCard(card, $("div.spells"));
  return false;
}

function addFour(deck) {
  for(var i = 0; i < 4; i++) { addOne(deck); }
  return false;
}

var allDecks = [
  {
    'name': 'Deck one',
    'creatures': [373543, 373543, 373543, 370688],
    'spells': [369041]
  }
];

var mvidToCards = {};

function addDeckList(savedDecks, form) {
  var select = $("select", form);
  var node = select[0];
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }

  // Default empty option
  var option = document.createElement("option");
  option.text = "";
  option.value = "";
  select.append(option);

  savedDecks.forEach(function(deck) {
    var option = document.createElement("option");
    option.text = deck['name'];
    option.value = deck['name'];
    select.append(option);
  });
}

function saveDeck(storage, deck, name) {
  var existingDeck = storage.filter(function(storedDeck) {
    return storedDeck.name == name;
  })[0];

  var mvidfun = function(x) { return x.multiverseid; };
  var storedDeck = {}

  if (existingDeck) { storedDeck = existingDeck }

  storedDeck.name          = name;
  storedDeck.creatures     = deck.creatures().map(mvidfun);
  storedDeck.spells        = deck.spells().map(mvidfun);
  storedDeck.artifacts     = deck.artifacts().map(mvidfun);
  storedDeck.enchantments  = deck.enchantments().map(mvidfun);
  storedDeck.lands         = deck.lands().map(mvidfun);
  storedDeck.planeswalkers = deck.planeswalkers().map(mvidfun);

  console.log(storedDeck);
  console.log(storage);

  if (!existingDeck) { storage.push(storedDeck); }
  addDeckList(storage, $("#deck-controls"));
}

function loadDeck(storage, name, table, mvidToCards) {
  var deck = storage.filter(function(storedDeck) {
    return storedDeck.name == name;
  })[0];

  var tableSections = {
    creatures: $("div.creatures"),
    spells: $("div.spells"),
    artifacts: $("div.artifacts"),
    enchantments: $("div.enchantments"),
    lands: $("div.lands"),
    planeswalkers: $("div.planeswalkers"),
  }

  for (var section in tableSections) {
    (deck[section] || []).forEach(function(mvid) {
      table.addCard(mvidToCards[mvid], tableSections[section]);
    });
  }
}

var table;

$(document).ready(function() {
  var deck = new Table($("div.deck")[0]);
  table = deck;
  var trash = document.querySelector('div.trash');
  trash.addEventListener('dragover', handleDragOver, false);
  trash.addEventListener('drop', function (e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    deck.removeCard(dragSrcEl);
    return false;
  }, false);
  $("#addone").click(function() { return addOne(deck); });
  $("#addfour").click(function() { return addFour(deck); });

  $("#load").click(function() {
    var deckName = $("select", $(this).parents("form")).val();
    if (deckName != '') {
      deck.clear();
      loadDeck(allDecks, deckName, deck, mvidToCards);
    }
    return false;
  });

  $("#save").click(function() {
    var form       = $(this).parents("form");
    var selectName = $("select", form).val();
    var textName   = $("input", form).val();

    var deckName = null;

    if (selectName == "" && textName == "") {
      deckName = "New Deck";
    } else if (selectName == "" || textName != "") {
      deckName = textName;
    } else {
      deckName = selectName;
    }

    console.log(deckName);
    saveDeck(allDecks, deck, deckName);
    return false;
  });

  var cols = document.querySelectorAll("div.deck > div.boardlist > div");

  addDeckList(allDecks, $("#deck-controls"));

  // Drop cards in particular columns
  [].forEach.call(cols, function(col) {
    col.addEventListener('dragover', handleDragOver, false);
    col.addEventListener('drop', function(e) {
      if (e.stopPropagation) { e.stopPropagation(); }
      var card = jQuery.data(dragSrcEl, "card");
      if (deck.isMember(dragSrcEl)) {
        deck.removeCard(dragSrcEl);
      }
      deck.addCard(card, $(e.target));
      return false;
    }, false);
  });

  $.getJSON("allsets.json", function(data) {
    var cards = ["BNG", "THS", "M14", "DGM", "GTC", "RTR"].reduce(function(prev, curr) {
      return prev.concat(data[curr].cards);
    }, []).sort(function(a,b) {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    });

    var selectList = $('#cardlist');
    var options = cards.map(function(card) {
      var option = document.createElement('option');
      option.value = card.multiverseid;
      option.innerHTML = card.name;
      jQuery.data(option, "card", card);
      return option;
    });

    options.forEach(function(option) { selectList.append(option); });

    for(var key in data) {
      data[key].cards.forEach(function(card) {
        card.imgUrl = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card";
        mvidToCards[card.multiverseid] = card;
      })
    }

    $("form input[name='filter']").change(function () {
      var txt = options[0].text.toLowerCase();
      var val = this.value;
      var found = options;
      
      if (val != "") {
        found = options.filter(function(option) {
          var txt = option.text.toLowerCase();
          var idx = txt.indexOf(val);
          return(idx > -1);
        });
      }

      var node = document.getElementById("cardlist");
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      found.forEach(function(option) { node.appendChild(option); });
    }).keyup( function () { $(this).change(); });

    $("#cardlist").change(function(data) {
      var option = $("option:selected", this);
      var card = jQuery.data(option[0], "card");
      var img = document.getElementById('preview')
      jQuery.data(img, "card", card);
      img.src = card.imgUrl;
      img.addEventListener("dragstart", function(e) {
        this.style.opacity = "0.4";
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = "move";
      }, false);
      img.addEventListener("dragend", function(e) {
        this.style.opacity = "1.0";
      }, false);
    });
  });
});
