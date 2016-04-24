module.exports = (context) => {
    const deferral = context.requireCordovaModule('q').defer(),
        fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        webpack = require('webpack'),
        HtmlWebpackPlugin = require('html-webpack-plugin');

    webpack({
        target: 'web',
        node: {
            net: 'empty',
            tls: 'empty',
            fs: 'empty'
        },

        context: path.join(context.opts.projectRoot, 'www_src'),
        entry: './app.jsx',

        output: {
            libraryTarget: 'umd',
            path: path.join(context.opts.projectRoot, 'www'),
            filename: 'app.js'
        },

        module: {
            loaders: [
                {
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015-webpack', 'stage-0', 'react']
                    },

                    test: /\.jsx$/,
                    exclude: /(node_modules|bower_components)/
                },

                { loader: 'json-loader', test: /\.json$/ },
                { loader: 'style-loader!css-loader', test: /\.css$/ },

                { loader: 'file-loader?name=images/leaflet/[name].[ext]', test: /\.png$/, include: /leaflet/ },

                { loader: 'file-loader?name=fonts/roboto-fontface/[name].[ext]', test: /\.eot$/, include: /roboto-fontface/ },
                { loader: 'url-loader?name=fonts/roboto-fontface/[name].[ext]&limit=10000&mimetype=application/font-woff', test: /\.woff$/, include: /roboto-fontface/ },
                { loader: 'url-loader?name=fonts/roboto-fontface/[name].[ext]&limit=10000&mimetype=application/font-woff', test: /\.woff2$/, include: /roboto-fontface/ },
                { loader: 'url-loader?name=fonts/roboto-fontface/[name].[ext]&limit=10000&mimetype=application/octet-stream', test: /\.ttf$/, include: /roboto-fontface/ },
                { loader: 'url-loader?name=fonts/roboto-fontface/[name].[ext]&limit=10000&mimetype=image/svg+xml', test: /\.svg$/, include: /roboto-fontface/ },

                { loader: 'file-loader?name=fonts/font-awesome/[name].[ext]', test: /\.eot$/, include: /font-awesome/ },
                { loader: 'url-loader?name=fonts/font-awesome/[name].[ext]&limit=10000&mimetype=application/font-woff', test: /\.woff$/, include: /font-awesome/ },
                { loader: 'url-loader?name=fonts/font-awesome/[name].[ext]&limit=10000&mimetype=application/font-woff', test: /\.woff2$/, include: /font-awesome/ },
                { loader: 'url-loader?name=fonts/font-awesome/[name].[ext]&limit=10000&mimetype=application/octet-stream', test: /\.ttf$/, include: /font-awesome/ },
                { loader: 'url-loader?name=fonts/font-awesome/[name].[ext]&limit=10000&mimetype=image/svg+xml', test: /\.svg$/, include: /font-awesome/ }
            ],
            noParse: /node_modules(\/|\\)json-schema(\/|\\)lib(\/|\\)validate\.js/
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
                inject: false
            })
        ]
    }, (err, stats) => {
        fs.access(path.join(context.opts.projectRoot, 'www/scripts'), (err) => {
            if (err)
                fs.mkdirSync(path.join(context.opts.projectRoot, 'www/scripts'));

            fs.writeFileSync(path.join(context.opts.projectRoot, 'www/scripts/platformOverrides.js'), '');

            deferral.resolve();
        });
    });

    return deferral.promise;
};
