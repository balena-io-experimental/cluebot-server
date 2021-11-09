const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const dotenv = require('dotenv');

const envPaths = require('./envPaths.json');

const env = process.env.NODE_ENV || 'development';

dotenv.config({
	path: envPaths[env]
});

module.exports = {
    entry: './client/index.tsx',
    target: 'web',
    mode: env,
    output: {
        path: path.resolve(__dirname, 'build', 'public'),
        filename: 'bundle.js'
    },
    resolve: {
		extensions: ['.ts', '.tsx', '.json', '.js'],
	},
    module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
			},
		],
	},
    plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'client', 'index.html'),
		}),
		new CopyPlugin({
			patterns: [
				{ from: "client/static/", to: "static/" },
				{ from: "client/fonts/", to: "fonts/" }
			],
		}),
	],
    devServer: {
		proxy: {
			'/': `http://localhost:${process.env.PORT}`
		},
		port: 8080,
		compress: true,
		hot: true,
		liveReload: true,
	},
}