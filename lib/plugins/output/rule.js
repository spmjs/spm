function Rule(id, project) {
  this.id = id;
}

Rule.prototype.check = function() {

};

Rule.prototype.getIncludes = function(handler, filename, includes, callback) {

};

Rule.prototype.output = function(handler, filename, includes, callback) {

};

Rule.prototype.check = function(filename, includes) {

};

var _rules = [];
exports.createRule = function(id) {
  if (_rules.indexOf(id) > -1) {
    console.warn('Repeated rule id!');
  }
  return new Rule(id);
};
