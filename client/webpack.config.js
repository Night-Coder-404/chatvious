import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";

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
      "process.env.DOMAIN": JSON.stringify("localhost"),
      "process.env.DOMAIN_URL": JSON.stringify("http://localhost:3000"),
      "process.env.SUB_DOMAIN": JSON.stringify("localhost"),
      "process.env.SUB_DOMAIN_URL": JSON.stringify("http://localhost:8040"),
      "process.env.USER_POOL_ID": JSON.stringify("us-west-1_gmrxTddmt"),
      "process.env.USER_POOL_CLIENT_ID": JSON.stringify(
        "2ot92gv0u6sivjbonnl13m487r"
      ),
      "process.env.COGNITO_DOMAIN_URL": JSON.stringify(
        "https://chatvious.auth.us-west-1.amazoncognito.com"
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
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
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
    delete config.optimization.minimize;
    delete config.optimization.minimizer;
  }
  return config;
};
