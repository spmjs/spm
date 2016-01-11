require('b');

if (require('./relative')) {
  console.log('a');
}

require('./a.tpl');
require('./a.noext');
