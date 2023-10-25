const { commonEsbuildConfigForVisualizations } = require('./node_modules/@displayr/ngviz/commonEsbuildConfigForVisualizations.js');
const { argv } = require('process');
const copy = require('esbuild-plugin-copy').default;

require('esbuild').build({
    ...commonEsbuildConfigForVisualizations(copy),
    external: ['jquery', 'plotly.js-dist-min'],
    watch: argv[2] === "--watch",
}).catch(() => process.exit(1));
