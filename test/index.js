/**
 * @usage node index.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../lib/utils/colors.js');

require('./utils/annotation.js');
require('./utils/combo.js');
require('./utils/compressor.js');
require('./utils/dependences.js');
require('./utils/loader_config.js');

require('./actions/action.js');
require('./actions/build.js');
require('./actions/completion.js');
require('./actions/help.js');
require('./actions/transport.js');
require('./actions/install.js');

require('./issues/conditional-compile/test.js');
