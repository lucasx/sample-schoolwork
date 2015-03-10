// VOID copy of app.js file for manager interface component of Streamdine
// November 2014
// Property of Streamdine
// Created in part by Lucas Sanchez

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var minify = require('express-minify');
var compress = require('compression');

var routes = require('./routes/index');

var stormpath = require('express-stormpath');

app = require('express.io')()
app.http().io()
app.use(compress());
// Stormpath authentication info: hard-coding right now for quick setup and testing
app.use(stormpath.init(app, {
	apiKeyFile: '/var/www/streamdine-manager-interface/public/apiKey.properties',
	//apiKeyFile: 'public/apiKey.properties',
	application: 'https://api.stormpath.com/v1/applications/23OUIGWT3TWGJ3523',
	secretKey: '00000000',
	enableHttps: false,
	sessionDuration: 1000 * 60 * 60 * 4, // Make sessions expire after 4 hrs.
	cache: 'memory',
	expandCustomData: true,
	redirectUrl: '/',
	enableAutoLogin: true,
	registrationUrl: '/register',
	loginUrl: '/login',
	logoutUrl: '/logout',
	registrationView: __dirname + '/views/register.jade',
	loginView: __dirname + '/views/login.jade',
	enableAccountVerification: true,
	enableForgotPassword: true,
	//enableRestaurantname: true,
	//requireRestaurantname: true,
	postRegistrationHandler: function (account, res, next) {
		console.log('User:', account.email, 'just registered!');
		next();
	},
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(cookieParser());

app.use(minify());
app.use(require('express.io').static(path.join(__dirname, 'public'))); // references to stylesheets and images

app.use('/', routes);

//module.exports = app;

app.listen(3000);