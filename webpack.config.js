/* eslint-disable no-use-before-define */

const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
   mode: 'production',
   target: 'node',
   entry: "./src/index.ts",
   output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'out'),
   },
   resolve: {
       symlinks: false,
       extensions: ['.ts','.js']
   },
   module: {
      rules: [
         {
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },

     optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
         test: /\.js(\?.*)?$/i,
         parallel: true,
         extractComments: true,
         minify: TerserPlugin.uglifyJsMinify,
         terserOptions: {
            output: {
              beautify: false,
            },
            toplevel: true
         }
      })],
   },

}
