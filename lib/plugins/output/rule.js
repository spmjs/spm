function Rule(id) {
  this.id = id;
}

Rule.prototype.check = function() {

};

Rule.prototype.getIncludes = function() {

};

Rule.prototype.output = function() {

};

Rule.prototype.check = function() {

};

var _rules = [];
exports.createRule = function(id) {
  if (_rules.indexOf(id) > -1) {
    console.warn('Repeated rule id!');
  }
  return new Rule(id);
};
