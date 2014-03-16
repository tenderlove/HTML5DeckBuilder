var dragSrcEl = null;


function handleDragOver(e) {
  if (e.preventDefault) { e.preventDefault(); }
  return false;
}

function addOne(deck) {
  var option = $("#cardlist option:selected")[0];
  var card = jQuery.data(option, 'card');

  var types = [
    ["Planeswalker", "planeswalkers"],
    ["Creature",     "creatures"],
    ["Artifact",     "artifacts"],
    ["Enchantment",  "enchantments"],
    ["Land",         "lands"],
  ]

  for(var i = 0; i < types.length; i++) {
    if (card.types.indexOf(types[i][0]) >= 0) {
      deck.addCard(card, types[i][1]);
      return false;
    }
  }

  deck.addCard(card, "spells");
  return false;
}

function addFour(deck) {
  for(var i = 0; i < 4; i++) { addOne(deck); }
  return false;
}

function Storage() { }
Storage.prototype.read = function() {
  if (window.localStorage.decks) {
    return JSON.parse(window.localStorage.decks);
  } else {
    return JSON.parse('[{"name":"Sample Deck","creatures":[270959,270959,270959,270959,373541,373541,373541,373541,368961,253624,253624,253624,253624,369030,366328,366310,366239,378524],"spells":[373575,373575,373575,373575,370609,370609,373639,373639,373639,373639,373701,366379],"artifacts":[373709,373544,290542],"enchantments":[373715,373715,253507],"lands":[370733,373734,369058,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373608,373595,373595,373595,373595,373595,373595,373595,373595],"planeswalkers":[370728]}]');
  }
}
Storage.prototype.write = function(data) {
  window.localStorage.decks = JSON.stringify(data);
}

var storage = new Storage();

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
  var decks = storage.read();
  var existingDeck = decks.filter(function(storedDeck) {
    return storedDeck.name == name;
  })[0];

  var mvidfun = function(x) { return x.multiverseid; };
  var storedDeck = {}

  if (existingDeck) { storedDeck = existingDeck }

  storedDeck.name = name;
  deck.rowTypes.forEach(function(type) {
    storedDeck[type] = deck[type]().map(mvidfun);
  });

  if (!existingDeck) { decks.push(storedDeck); }
  addDeckList(decks, $("#deck-controls"));
  storage.write(decks);
}

function loadDeck(storage, name, table, mvidToCards) {
  var deck = storage.read().filter(function(storedDeck) {
    return storedDeck.name == name;
  })[0];

  var resolved = {};

  for (var section in table.cardColumns) {
    resolved[section] = (deck[section] || []).map(function(mvid) {
      return mvidToCards[mvid];
    });
  }
  table.setDeck(resolved)
}

function drawColorDistribution(deck) {
  var colorDist = deck.colorDistribution();
  var colors = {
    'Red': 'Red',
    'Blue': 'Blue',
    'Black': 'Black',
    'White': 'Purple',
    'Green': 'Green'
  };
  var data = google.visualization.arrayToDataTable(
      [['Color', 'Number of Cards']].concat(colorDist)
      );

  var options = {
    title: 'Card Color Distribution',
    slices: colorDist.map(function(d) { return { color: colors[d[0]] }; }),
    legend: { position: 'bottom' }
  };

  var chart = new google.visualization.PieChart(document.getElementById('colordist'));
  chart.draw(data, options);
}

function drawSymbolDistribution(deck) {
  var symbolDist = deck.symbolDistribution();
  var colors = {
    'R': 'Red',
    'U': 'Blue',
    'B': 'Black',
    'W': 'Purple',
    'G': 'Green'
  };

  var data = google.visualization.arrayToDataTable(
      [['Symbol', 'Number of Cards']].concat(symbolDist)
      );

  var options = {
    title: 'Card Symbol Distribution',
    slices: symbolDist.map(function(d) { return { color: colors[d[0]] }; }),
    legend: { position: 'bottom' }
  };

  var chart = new google.visualization.PieChart(document.getElementById('symboldist'));
  chart.draw(data, options);
}

function drawCardTypeDistribution(deck) {
  var colorDist = deck.cardTypeDistribution();

  var data = google.visualization.arrayToDataTable(
      [['Type', 'Number of Cards']].concat(colorDist)
      );

  var options = {
    title: 'Card Type Distribution',
    legend: { position: 'bottom' }
  };

  var chart = new google.visualization.PieChart(document.getElementById('cardtypedist'));
  chart.draw(data, options);
}

function drawFirstHandProbability(deck) {
  var firstHandProb = deck.firstHandProbability();
  var table = document.getElementById("firsthandlist");

  firstHandProb.forEach(function(val) {
    var tr = document.createElement('tr');
    var tdName = document.createElement('td');
    var tdProb = document.createElement('td');
    tdName.innerHTML = val[0];
    tdName.className = "cardname";
    tdProb.innerHTML = (val[1] * 100).toFixed(2) + "%";
    tdProb.className = "probability";
    tr.appendChild(tdName);
    tr.appendChild(tdProb);
    table.appendChild(tr);
  });
}

function drawManaCurve(deck) {
  var data = google.visualization.arrayToDataTable(
      [['Mana', 'Converted Mana Cost']].concat(deck.manaDistribution())
  );

  var options = {
    title: 'Mana Curve',
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  var chart = new google.visualization.LineChart(document.getElementById('manacurve'));
  chart.draw(data, options);
}

$(document).ready(function() {
  var deck = new Table($("div.deck")[0]);
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
      loadDeck(storage, deckName, deck, mvidToCards);
    }
    return false;
  });

  $("#new").click(function() {
    deck.clear();
    var form = $(this).parents("form");
    $("select", form).val('');
    $("input", form).val('');
    return false;
  });

  $("#save").click(function() {
    var form = $(this).parents("form");
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

    saveDeck(storage, deck, deckName);
    $("select", form).val(deckName);
    $("input", form).val('');
    return false;
  });

  addDeckList(storage.read(), $("#deck-controls"));

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
