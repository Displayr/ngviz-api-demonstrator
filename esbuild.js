const { esbuildConfigBuilder } = require('@displayr/ngviz');
const copy = require('esbuild-plugin-copy').default;

require('esbuild').build({
    ...esbuildConfigBuilder(copy),
    external: ['jquery', 'plotly.js'],
}).catch(() => process.exit(1));
