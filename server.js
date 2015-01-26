'use strict';
var User = require('./models/data');
var koa = require('koa');
var logger = require('koa-logger');
var session = require('koa-generic-session');
var bodyparser = require('koa-bodyparser');
var route = require('koa-router');
var mongoose = require('mongoose');
var config = require('./config');

mongoose.connect('mongodb://localhost/datagather');
mongoose.connection.on('error', function(err){
    console.error('Error connecting to db', err);
});

var app = koa();
app.keys = config.keys;

app.use(session({
    key: 'datagather'
}));

app.use(logger());
app.use(bodyparser());

var publicRoute = new route();

publicRoute.get('/', function*(){
    if (this.session.user === undefined)
    {
        this.status = 403;
        return;
    }
    this.body = yield User.findOne(this.session.user).exec();
});

publicRoute.post('/newUser', function*(){
    var newUser = this.request.body;
    User.addUser(newUser.username, newUser.password);
});

publicRoute.post('/auth', function*(){
    var user = this.request.body;
    try{
        var userBd = yield User.matchUser(user.username, user.password);
        this.session.user = userBd._id;
        console.log(userBd);
    }
    catch(err){
        console.log(err);
    }
});

app.use(publicRoute.middleware());

app.listen(8080);

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    process.exit();
});

console.log('Listening on 8080');
