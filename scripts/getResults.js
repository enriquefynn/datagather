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
            var userJSON = JSON.stringify(users[i]);
            var bigStr = "";
            for (var j = 0; j < userJSON.wifiLog.length; ++j){
                var timestamp = new Date(userJSON.wifiLog[j].timestamp).getTime();
                var name = userJSON.wifiLog[j].name;
                bigStr+= timestamp + ' ' + name + '\n';
            }
            fs.appendFileSync(userJSON.username + '-wifi.txt', 
                bigStr);
            bigStr = "";
            for (var j = 0; j < userJSON.locationLog.length; ++j){
                var timestamp = new Date(usesJSON.locationLog[j].timestamp).getTime();
                var lat = userJSON.locationLog[j].lat;
                var lon = userJSON.locationLog[j].lat;
                bigStr+= timestamp + ' ' + lat + ' ' + lon + '\n';
            }

            fs.appendFileSync(userJSON.username + '-gps.txt', 
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

