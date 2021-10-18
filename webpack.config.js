const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const dotenv = require('dotenv');

const envPath = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({
	path: envPath
});

module.exports = {
    entry: './client/index.tsx',
    target: 'web',
    mode: process.env.NODE_ENV || 'development',
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
			],
		}),
	],
    devServer: {
		proxy: {
			'/': `http://localhost:${process.env.PORT}`
		},
		port: process.env.DEV_SERVER_PROXY_PORT,
		compress: true,
		hot: true,
		liveReload: true,
	},
}