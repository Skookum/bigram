var assert = require("assert");
var fixture = require("./fixture.json");
var Blurred = require("../index");
 
var b = new Blurred({
  collection: fixture,
  mapper: function(i) {
    return ['first_name', 'last_name', 'college'].reduce(function(str, prop) {
      return str + " " + i[prop];
    }, '');
  }
});

function name(player) {
  return player.first_name + " " + player.last_name;
}
 
(function DescribeCollege() {
  var results = b.search("Ohi", 0.3);
  assert(results.length === 2, 'There should only be two matches for Ohi');
  assert(name(results[0]) === 'Philly Brown', name(results[0]) + ' should be Philly Brown');
  assert(name(results[1]) === 'Andrew Norwell', name(results[1]) + ' should be Andrew Norwell Brown');
})();


(function DescribeCam() {
  var results = b.search("Cam", 0.25);
  assert(results.length === 3, 'There should be three matches for Cam with .25 grams');
  var results = b.search("Cam", 0.3);
  assert(results.length === 1, 'There is only one Cam Newton');
})();

