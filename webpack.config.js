const path = require('path');

module.exports = {
  entry: {
    tabulka: './tabulka.jsx',
    'tabulka-okresy': './tabulka-okresy.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
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
