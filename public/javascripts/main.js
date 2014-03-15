var dragSrcEl = null;

function Deck(cards) { this.cards = cards; }

Deck.prototype.handleDragStart = function(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
}

Deck.prototype.handleDragEnd = function(e) { this.style.opacity = '1.0'; };
Deck.prototype.handleDragOver = function(e) {
  if (e.preventDefault) { e.preventDefault(); }
  return false;
};

Deck.prototype.addCard = function(card, loc) {
  var div = document.createElement('div');
  var img = document.createElement('img');
  var deck = this;

  div.className = "card";
  img.src = card.imgUrl;
  img.setAttribute("draggable", true);
  img.addEventListener('dragstart', this.handleDragStart, false);
  img.addEventListener('dragend', this.handleDragEnd, false);
  img.addEventListener('dragover', this.handleDragOver, false);
  img.addEventListener('drop', function(e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    var card = jQuery.data(dragSrcEl, "card");
    var column = e.target.parentNode.parentNode;
    deck.addCard(card, $(column));
    alignImages();
    return false;
  }, false);
  $(div).append(img);
  loc.append(div);
  alignImages();
}

Deck.prototype.removeCard = function(img) {
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

$(document).ready(function() {
  var deck = new Deck([]);
  var trash = document.querySelector('div.trash');
  trash.addEventListener('dragover', handleDragOver, false);
  trash.addEventListener('drop', function (e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    deck.removeCard(dragSrcEl);
    return false;
  }, false);
  $("#addone").click(function() { return addOne(deck); });
  $("#addfour").click(function() { return addFour(deck); });
  var cols = document.querySelectorAll("div.deck > div.boardlist > div");

  // Drop cards in particular columns
  [].forEach.call(cols, function(col) {
    col.addEventListener('dragover', handleDragOver, false);
    col.addEventListener('drop', function(e) {
      if (e.stopPropagation) { e.stopPropagation(); }
      var card = jQuery.data(dragSrcEl, "card");
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
      card.imgUrl = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card";
      option.innerHTML = card.name;
      jQuery.data(option, "card", card);
      return option;
    });

    options.forEach(function(option) { selectList.append(option); });

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
