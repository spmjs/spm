/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var ActionFactory = exports;

ActionFactory.create = function(name, constructor) {
  function SubAction(args) {
    Action.call(this, args);
    if (constructor) {
      constructor.call(this);
    }
  }
  util.inherits(SubAction, Action);

  SubAction.name_ = name;
  return SubAction;
};
