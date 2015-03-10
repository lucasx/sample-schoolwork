// VOID copy of app.js file for MySQL testing with node.js for Streamdine ('Winter' project)
// December 2014
// Property of Streamdine
// Created in part by Lucas Sanchez

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host    : 'streamdine-db-test.iodfhbdgwe.us-east-1.rds.amazonaws.com',
        user    : 'streamdine',
        password: 'streamdine',
        database: 'test',
        port    : '3306'
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

// Database connection
io.on('connection', function(socket) {
    console.log('a user connected');
    
    socket.on('disconnect', function() {
        console.log('a user disconnected');
    });
    
    // Add a restaurant
    socket.on('add restaurant', function(name) {
        console.log('adding restaurant: ' + name);
        knex('restaurants')
            .insert({name: name})
            .then(function() {
                console.log('Added restaurant and name to database');
            });
    });

    // Delete a restaurant
    socket.on('delete restaurant', function(restaurantName) {
        console.log('deleting restaurant: ' + restaurantName);
        knex('restaurants')
            .where({name: restaurantName})
            .del()
            .then(function() {
                console.log('restaurant successfully deleted');
            });
    });

    // Fetch all restaurants
    socket.on('get restaurants', function() {
        console.log('getting all restaurants...');
        knex('restaurants')
            .select()
            .then(function(restaurants) {
                console.log('restaurants: ' + JSON.stringify(restaurants));
                io.to(socket.id).emit('get restaurants', JSON.stringify(restaurants));
            });
    });

    socket.on('get categories', function(restaurantName, form) {
        console.log('getting food categories for ' + restaurantName + '...');
        knex('restaurants')
            .where({name: restaurantName}) //should be only one restaurant with this name
            .then(function(restaurants) {
                restaurants = JSON.stringify(restaurants);
                var restaurant = JSON.parse(restaurants)[0]; //Should be only one restaurant in the array
                console.log(restaurantName + ' food categories: ' + restaurant.food_categories);
                var stringCategories = restaurant.food_categories;
                io.to(socket.id).emit('get categories', JSON.parse(stringCategories), form);
            });
    });
});

// Knex table setup
/*
knex.schema.createTable('restaurants', function(table) {
    table.increments();
    table.string('name');
})
    .then(function() {
        console.log('Created restaurants table');
    });
*/
/*
knex.schema.table('restaurants', function(table) {
    table.string('food_categories'); //Each one separated by a comma
})
    .then(function() {
        console.log('Created food_categories column');
    });
*/
/*//Added Entrees and Beverages menu categories to Carl's Cabbages restaurant
knex('restaurants')
    .where({name:'Carl\'s Cabbages'})
    .update({
        food_categories: '["entrees","beverages"]'
    }).then(function() {
        console.log('added menu categories to Carl\'s Cabbages');
    });
*/

http.listen(3000, function() {
    console.log('Listening on port 3000');
});