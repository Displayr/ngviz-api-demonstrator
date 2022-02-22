var copy = require('esbuild-plugin-copy').default;
require('esbuild').build({
    entryPoints: ['./src'], // Note that we build straight from TypeScript to get the best sourcemaps.  We still run tsc first because it does actual type checking.
    bundle: true,
    sourcemap: true,
    format: 'cjs',  // Needed to produce something we can eval()
    target: 'es6',
    outfile: 'dist/index.js',
    external: ['jquery', 'plotly.js'],
    plugins: [
        copy({
            verbose: false,
            assets: {
                from: ['./assets/*' ],
                to: ['./assets'],
            },
        }),
        copy({
            verbose: false,
            assets: {
                from: ['ngviz.json' ],
                to: ['.'],
            },
        }),
    ],
}).catch((err) => process.exit(1))
