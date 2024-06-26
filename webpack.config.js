import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: {
    navBar: "./src/public/ts/navBar/navBar.ts",
    dashboard: "./src/public/ts/dashboard/script.ts",
    clientCreateRoom:
      "./src/public/ts/dashboard/clientRooms/clientCreateRoom.ts",
    clientJoinRoom: "./src/public/ts/dashboard/clientRooms/clientJoinRoom.ts",
    chatRoom: "./src/public/ts/chatRoom/chatRoom.ts",
    roomInfoJoinRequest: "./src/public/ts/roomInfoPage/roomInfoJoinRequest.ts",
    roomInfoAcceptJoin: "./src/public/ts/roomInfoPage/roomInfoAcceptJoin.ts",
    roomInfoKickUser: "./src/public/ts/roomInfoPage/roomInfoKickUser.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("dist", "public", "ejs"),
    clean: true,
  },
  devtool: "inline-source-map",
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".jsx", ".js", "..."],
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
    delete config.devtool;
  } else {
    config.mode = "development";
  }
  return config;
};
