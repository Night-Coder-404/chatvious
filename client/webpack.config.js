import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: "./src/index.tsx",
  output: {
    // filename: "[name]main.js",
    path: path.resolve("..", "dist", "public"),
    clean: {
      keep: /ejs\//,
    },
  },
  devServer: {
    static: "../dist/public",
    open: true,
    port: 5500,
    historyApiFallback: true,
  },
  devtool: "inline-source-map",
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      // filename: "./index.html",
    }),
    new webpack.DefinePlugin({
      "process.env.IS_DEV_SERVER": JSON.stringify(true),
      "process.env.DOMAIN": JSON.stringify("chatvious.coding-wielder.com"),
      "process.env.DOMAIN_URL": JSON.stringify(
        "https://chatvious.coding-wielder.com/main"
      ),
      "process.env.SUB_DOMAIN": JSON.stringify(
        "main.chatvious.coding-wielder.com"
      ),
      "process.env.SUB_DOMAIN_URL": JSON.stringify(
        "https://main.chatvious.coding-wielder.com"
      ),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },
};

export default () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
