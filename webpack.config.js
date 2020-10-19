const path = require('path');

module.exports = {
  entry: './tabulka.jsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'tabulka.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  devServer: {
    contentBase: './build'
  }
};
