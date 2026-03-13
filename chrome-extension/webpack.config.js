const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './src/background/service-worker.ts',
    'content-linkedin': './src/content-scripts/linkedin.ts',
    'content-indeed': './src/content-scripts/indeed.ts',
    'content-naukri': './src/content-scripts/naukri.ts',
    'content-glassdoor': './src/content-scripts/glassdoor.ts',
    'content-workday': './src/content-scripts/workday.ts',
    'content-icims': './src/content-scripts/icims.ts',
    'auth-bridge': './src/content-scripts/auth-bridge.ts',
    popup: './src/popup/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '../manifest.json' },
        { from: 'icons', to: '../icons' },
        { from: 'src/popup/popup.html', to: '../popup/popup.html' },
        { from: 'src/popup/popup.css', to: '../popup/popup.css' },
        { from: 'src/styles/content.css', to: 'content.css' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  optimization: {
    minimize: true,
  },
};
