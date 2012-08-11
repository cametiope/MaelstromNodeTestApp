var http = require('http'),
	deferred = require('deferred'),
	isProd = process.env.NODE_ENV == 'production';

function exchangeCode(code) {
	var options = {
			host: 'prototype.projectmaelstrom.com',
			port: isProd ? 80 : 5000,
			path: "/module/token/exchange?code=" + code + "&secret=" + process.env.APP_SECRET,
			method: 'GET'
		},
		def = deferred();
	console.log("exchanging token at ", options)
	http.get(options, function (agent) {
		var data = ''
		agent.on('data', function (chunk) {
			data += chunk;
		});
		agent.on('end', function () {
			def.resolve(data);
		});
		
	}).on('error', function(err) {
		def.resolve({error: String(err)})
	});

	return def.promise;
}

function getTokenInfo(token) {
	var options = {
			host: 'prototype.projectmaelstrom.com',
			port: isProd ? 80 : 5000,
			path: "/module/token/info?token=" + token + "&secret=" + process.env.APP_SECRET,
			method: 'GET'
		},
		def = deferred();
	http.get(options, function (agent) {
		var data = ''
		agent.on('data', function (chunk) {
			data += chunk;
		});
		agent.on('end', function () {
			def.resolve(JSON.parse(data));
		});
		
	}).on('error', function (err) {
		def.resolve({error: String(err)})
	});

	return def.promise;	
}

module.exports = function(app){
	var apiHost = isProd ? 'http://prototype.projectmaelstrom.com' : 'http://prototype.projectmaelstrom.com:5000',
		selfHost = isProd ? 'http://nodetest.projectmaelstrom.com' : 'http://nodetest.projectmaelstrom.com:4000';

	function renderIndex(req, res) {
		if (req.session.token) {
			getTokenInfo(req.session.token)(function (info) {
				var name = info ? info.name : null;

				res.render('index', {name: name, apiHost: apiHost, selfHost: selfHost, appid: app.config.appid});	
			}).end();
		} else {
			res.render('index', {name: null, apiHost: apiHost, selfHost: selfHost, appid: app.config.appid});
		}
		
	};

	app.get('/', renderIndex);

	app.post('/', renderIndex);

	app.get('/callback', function (req, res) {
		if (req.query.code) {
			exchangeCode(req.query.code)(function (token) {
				req.session.token = token;
				res.redirect('/')
			});	
		} else {
			req.flash('info', "You don't like us? You didn't approve the app!");
			res.redirect('/');
		}
		
	});
};
