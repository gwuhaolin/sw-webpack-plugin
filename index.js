const path = require('path');
const fs = require('fs');
const url = require('url');
const DefinePlugin = require('webpack/lib/DefinePlugin');

/**
 * whether is webpack compiler is in Production env
 *
 * if process.env.NODE_ENV from node.js env is production
 * or webpack use DefinePlugin to define process.env.NODE_ENV==="production"
 * will return true else return false
 * @param compiler
 * @returns {boolean}
 */
function isProduction(compiler) {
  if (process.env.NODE_ENV === 'production') {
    // define in nodejs
    return true;
  }
  const plugins = compiler.options.plugins;
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    try {
      if (plugin.__proto__.constructor === DefinePlugin) {
        if (plugin.definitions['process.env.NODE_ENV'] === '"production"') {
          // define by DefinePlugin
          return true;
        }
      }
    } catch (_) {
      //
    }
  }
  return false;
}

/**
 * add a file to webpack compilation output files
 * @param compilation webpack compilation
 * @param filename output file name
 * @param fileContent output file content
 */
function addFileToWebpackOutput(compilation, filename, fileContent) {
  compilation.assets[filename] = {
    source: () => {
      return fileContent;
    },
    size: () => {
      return Buffer.byteLength(fileContent, 'utf8');
    }
  };
}

/**
 * get publicPath config in webpack
 * @param compilation
 * @returns {*|string}
 */
function getPublicPath(compilation) {
  return compilation.compiler.options.output.publicPath || '';
}

/**
 * an WebPlugin handle a html page
 */
class SwWebpackPlugin {

  /**
   * @param options
   *
   * options.sw {string}
   *        sw.js template file path
   *
   * options.includes
   *        reg array to includes file to be cache
   *
   * options.excludes
   *        reg array to excludes file to be cache
   *
   * options.reduce
   *        function to modify _sw data before inject
   *
   * @constructor
   */
  constructor(options) {
    this.options = options || {};
  }

  // 根据配置的 includes 和 excludes 检查文件是否需要被添加到缓存列表
  shouldCache(fileUrl) {
    const {
      includes = [
        /\.(js|css|html|png|jpe?g)$/,
      ], excludes = []
    } = this.options;
    for (let i = 0; i < includes.length; i++) {
      const include = includes[i];
      if (!include.test(fileUrl)) {
        return false;
      }
    }
    for (let i = 0; i < excludes.length; i++) {
      const exclude = excludes[i];
      if (exclude.test(fileUrl)) {
        return false;
      }
    }
    return true;
  }

  getSwContent() {
    const {sw} = this.options;
    if (fs.existsSync(sw)) {
      return fs.readFileSync(sw);
    } else {
      if (typeof sw === 'string') {
        return sw
      } else {
        return fs.readFileSync(path.resolve(__dirname, 'sw.js'));
      }
    }
  }

  // call by webpack
  apply(compiler) {
    const {reduce} = this.options;
    compiler.plugin('emit', (compilation, callback) => {
      const publicPath = getPublicPath(compilation);
      const fileUrlList = [];

      Object.keys(compilation.assets).forEach((filename) => {
        const fileUrl = url.resolve(publicPath, filename);
        if (this.shouldCache(fileUrl)) {
          fileUrlList.push(fileUrl);
        }
      });

      let injectData = {
        assets: fileUrlList,
        hash: compilation.hash,
      };
      if (typeof reduce === 'function') {
        injectData = reduce(injectData);
      }
      let fileContent = `
var _sw = ${JSON.stringify(injectData)};
${this.getSwContent()}`;

      if (isProduction(compilation)) {
        const UglifyJS = require('uglify-js');
        const uglifyJSRes = UglifyJS.minify(fileContent);
        if (uglifyJSRes.error) {
          console.error(uglifyJSRes.error);
        } else {
          fileContent = uglifyJSRes.code;
        }
      }

      addFileToWebpackOutput(compilation, 'sw.js', fileContent);
      callback();
    });
  }
}

module.exports = SwWebpackPlugin;
