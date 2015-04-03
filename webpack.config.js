var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: './markdown.js',
	output: {
		path: path.join(__dirname , './dest'),
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{test: /\.css/, loader: "style-loader!css-loader"}
		]
	},
	externals: {
		"jquery": "jQuery",
		"katex": "katex",
		"_": "_"
	}
}