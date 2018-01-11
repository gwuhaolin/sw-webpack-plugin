# sw-webpack-plugin
ServiceWorker webpack plugin

## Use
install by:
```bash
npm i -D sw-webpack-plugin
```
import in `webpack.config.js`:
```js
const SwWebpackPlugin = require('sw-webpack-plugin');
module.exports = {
  plugins:[
    new SwWebpackPlugin({
      // sw.js template file path
      sw: '/path/to/sw.js',
      // reg to include file to be cache
      include: /\.(js|css|html|png|jpe?g)$/,
      // reg to exclude file to be cache
      exclude: undefined,
      // function to modify injectData data before inject _sw into sw.js
      reduce: function(injectData) {
        injectData = {
          assets: shouldCacheFileUrlList,
          hash: compilation.hash,
        }
      },
    }),
  ]
}
```
