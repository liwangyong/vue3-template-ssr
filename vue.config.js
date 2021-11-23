const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const nodeExternals = require("webpack-node-externals");
const webpack = require("webpack");
const criticalCssWebpackPlugin = require("critical-css-webpack-plugin");

const criticalCssOptions = {
  // type: boolean/object，是否inline生成的critical-path css。
  // true：生成html，false：生成css，object：向`inline-critical`传递配置对象
  inline: true,
  // type: string，读取和写入源的目录
  base: './dist',
  // type: string，要操作的html源代码，此选项优先于src选项
  // html: '',
  // type: array，css路径的数组
  // css: [],
  // type: string，要操作的html源代码的位置
  src: "index.html",
  // type: string，保存操作输出的位置，如果要同时存储`html`和`css`，使用`html`和`css`的对象
  target: "index.html",
  // type: integer，1300，目标视口的宽度
  width: 1300,
  // type: integer，900，目标视口的高度
  height: 900,
  // type: array，包含宽度和高度的数组，如果设置，优先于width和height选项
  dimensions: [],
  // type: boolean，是否压缩生成的critical-path css
  // minify: true,
  // type: boolean，小心使用，从html中删除inline样式，它会基于提取的内容生成新的引用，因此可以安全地在多个html文件引用同一样式文件。删除每页的关键css会为每个页面生成唯一一个异步加载css。意味着你不能跨多页面缓存
  extract: true,
  // type: boolean，inline图片
  inlineImages: true,
  // type: array，内联程序开始查询assets时的目录/url列表
  assetPaths: [],
  // 设置base64内联图片的最大大小（以字节为单位）
  maxImageFileSize: 10240000,
  // type: object/function，critical尝试相对文档的assets path
  rebase: undefined,
  // type: array
  ignore: [],
  // type: string，获取远程src时的用户代理
  // userAgent: '',
  // type: object,penthouse的配置选项
  penthouse: {
    // propertiesToRemove: ['background'],
    // 强制包含的selector
    forceInclude: [".card", ".card__list", ".card__main", ".card__img", ".card__article"],
    forceExclude: []
  },
  // type: object，got的配置选项
  request: {},
  // type: string，RFC2617授权：user
  user: undefined,
  // type: string，RFC2617授权：pass
  pass: undefined,
  // type: boolean，如果找不到css，则抛出错误
  strict: false
};

module.exports = {
  chainWebpack: (webpackConfig) => {
    webpackConfig
      .plugin("critical")
      .use(criticalCssWebpackPlugin, [criticalCssOptions])
      .tap((error) => {
        console.log(error, "critical css generate error");
        return error;
      });
    // 我们需要禁用 cache loader，否则客户端构建版本会从服务端构建版本使用缓存过的组件
    webpackConfig.module.rule("vue").uses.delete("cache-loader");
    webpackConfig.module.rule("js").uses.delete("cache-loader");
    webpackConfig.module.rule("ts").uses.delete("cache-loader");
    webpackConfig.module.rule("tsx").uses.delete("cache-loader");

    if (!process.env.SSR) {
      // 将入口指向应用的客户端入口文件
      webpackConfig.entry("app").clear().add("./src/entry-client.ts");
      return;
    }

    // 将入口指向应用的服务端入口文件
    webpackConfig.entry("app").clear().add("./src/entry-server.ts");

    // 这允许 webpack 以适合于 Node 的方式处理动态导入，
    // 同时也告诉 `vue-loader` 在编译 Vue 组件的时候抛出面向服务端的代码。
    webpackConfig.target("node");
    // 这会告诉服务端的包使用 Node 风格的导出
    webpackConfig.output.libraryTarget("commonjs2");

    webpackConfig
      .plugin("manifest")
      .use(new WebpackManifestPlugin({ fileName: "ssr-manifest.json" }));

    // https://webpack.js.org/configuration/externals/#function
    // https://github.com/liady/webpack-node-externals
    // 将应用依赖变为外部扩展。
    // 这使得服务端构建更加快速并生成更小的包文件。

    // 不要将需要被 webpack 处理的依赖变为外部扩展
    // 也应该把修改 `global` 的依赖 (例如各种 polyfill) 整理成一个白名单
    webpackConfig.externals(nodeExternals({ allowlist: /\.(css|vue)$/ }));

    webpackConfig.optimization.splitChunks(false).minimize(true);

    // webpackConfig.plugins.delete("preload");
    // webpackConfig.plugins.delete("prefetch");
    // webpackConfig.plugins.delete("progress");
    // webpackConfig.plugins.delete("friendly-errors");

    webpackConfig.plugin("limit").use(
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    );
  }
};
