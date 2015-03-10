// VOID copy of main.js file for MySQL testing with node.js for Streamdine ('Winter' project)
// Interaction logic between front end html and backend MySQL server
// December 2014
// Property of Streamdine
// Created in part by Lucas Sanchez

var socket = io();

$(document).ready(function() {
    socket.emit('get restaurants');

    $('#add_menu_restaurants').change(function() {
        var val =  $('#add_menu_restaurants').val();
        console.log("changed to this value: " + val);
        console.log("Emitting get categories event.");
        socket.emit('get categories', val, 'add');
    });

    $('#update_menu_restaurants').change(function() {
        var val =  $('#update_menu_restaurants').val();
        console.log("changed to this value: " + val);
        console.log("Emitting get categories event.");
        socket.emit('get categories', val, 'update');
    });
});

socket.on('get restaurants', function(restaurants) {
    var select_default = '<option selected disabled>-Select a Category-</option>';
    $('#restaurant_to_delete').html(select_default);
    $('#add_menu_restaurants').html(select_default);
    $('#update_menu_restaurants').html(select_default);
    var list = JSON.parse(restaurants);
    for(var i=0; i<list.length; i++) {
        var string = '<option value="' + list[i].name
            + '">' + list[i].name + '</option>';
        $('#restaurant_to_delete').append(string);
        $('#add_menu_restaurants').append(string);
        $('#update_menu_restaurants').append(string);
    }
});

socket.on('get categories', function(categories, form) {
    var select = $('#' + form + '_menu_category');
    select.html('<option selected disabled>-Select a Category-</option>');

    console.log('These are the categories we are assigning to the '
    + form + ' form:');

    for(var i=0; i<categories.length; i++) {
        console.log(categories[i]);
        var string = '<option value="' + categories[i];
        string += '">' + categories[i] + '</option>';
        select.append(string);
    }
    console.log('categories assigned');
});

$('form#new_restaurant').submit(function() {
    console.log('Submitted new restaurant with name ' + $('#restauranti_to_add').val());
    socket.emit('add restaurant', $('#restaurant_to_add').val());
    socket.emit('get restaurants'); 
    return false;
});

$('form#delete_restaurant').submit(function() {
    console.log('Deleted restaurant with name ' + $('#restaurant_to_delete option:selected').val());
    socket.emit('delete restaurant', $('#restaurant_to_delete option:selected').val());
    socket.emit('get restaurants');
    return false;
});

$('form#item').submit(function() {
    console.log('Submitted new menu item');
    return false;
});