function Simulator(cards) {
  this.cards = _.clone(cards);
  this.cards.forEach(function (card) {
    Simulator.create(card);
  });
}

Simulator.prototype.simulate = function(handSize, count, playCount) {
  console.log(playCount);

  for(var i = 0; i < count; i++) {
    var hand = _.sample(this.cards, handSize);
    var split = _.partition(hand, function(card) { return card.land });
    var lands = split[0];
    var castable = split[1];

    var availableMana = _.flatten(lands.map(function(card) { return card.provides; }));
    var manaCounts = _.countBy(availableMana, function(symbol) { return symbol; });
    // console.log({"available": availableMana, "manaCount": manaCounts});

    castable.forEach(function(card) {
      var canPlay = Simulator.playable(card, lands, manaCounts);
      var mvid = card.multiverseid
      if (canPlay) {
        playCount[mvid] += 1;
      }
    });
  }

  return playCount;
}

Simulator.createLand = function(card) {
  card.land = true;

  switch(card.name) {
    case "Swamp":
      card.provides = ["B"];
      break;
    case "Island":
      card.provides = ["U"];
      break;
    case "Mutavault":
      card.provides = ["1"];
      break;
    case "Temple of Deceit":
      card.provides = ["B", "U"];
      break;
    case "Dimir Guildgate":
      card.provides = ["B", "U"];
      break;
    default:
      throw "Unknown land: " + card.name;
  }
};

Simulator.playable = function(card, lands, providedMana) {
  if(card.cmc > lands.length) {
    return false;
  }
  // console.log({"name": card.name, "needs": card.needs, "has": providedMana});
  for (var symbol in card.needs) {
    if((providedMana[symbol] || 0) < card.needs[symbol]) {
      return false;
    }
  }
  return true;
};

Simulator.createCastable = function(card) {
  card.land = false;
  var re = new RegExp("{([A-Z])}", "g");
  var needs = [];
  var m;
  while (m = re.exec(card.manaCost)) {
    needs.push(m[1]);
  }
  card.needs = _.countBy(needs, function(x) { return x; });
};

Simulator.create = function(card) {
  if (card.cmc) {
    Simulator.createCastable(card);
  } else {
    Simulator.createLand(card);
  }
  return card;
};
