'use strict';
var User = require('../models/data');
var mongoose = require('mongoose');
var fs = require('fs');
var co = require('co');

var config = require('../config');

mongoose.connect('mongodb://localhost/datagather');
mongoose.connection.on('error', function(err){
    console.error('Error connecting to db', err);
});

co(function*(){
    try{
        var usersQ = User.find({});
        var users = yield usersQ.exec(); 
        for (var i = 0; i < users.length; ++i){
            var bigStr = "";
            for (var j = 0; j < users[i].wifiLog.length; ++j){
                var timestamp = new Date(users[i].wifiLog[j].timestamp).getTime();
                var name = users[i].wifiLog[j].name;
                bigStr+= timestamp + ' ' + name + '\n';
            }
            fs.appendFileSync(users[i].username + '-wifi.txt', 
                bigStr);
            bigStr = "";
            for (var j = 0; j < users[i].locationLog.length; ++j){
                var timestamp = new Date(usesJSON.locationLog[j].timestamp).getTime();
                var lat = users[i].locationLog[j].lat;
                var lon = users[i].locationLog[j].lat;
                bigStr+= timestamp + ' ' + lat + ' ' + lon + '\n';
            }

            fs.appendFileSync(users[i].username + '-gps.txt', 
                bigStr);
            users[i].locationLog = [];
            users[i].wifiLog = [];
            users[i].save();
        }
        process.exit();
    }
    catch(err){
        console.log(err);
    }
});

