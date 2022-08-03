const { commonEsbuildConfigForVisualizations } = require('./node_modules/@displayr/ngviz/commonEsbuildConfigForVisualizations.js');
const copy = require('esbuild-plugin-copy').default;

require('esbuild').build({
    ...commonEsbuildConfigForVisualizations(copy),
    external: ['jquery', 'plotly.js-dist-min'],
}).catch(() => process.exit(1));
