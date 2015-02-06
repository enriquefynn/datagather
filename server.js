'use strict';
var User = require('./models/data');
var koa = require('koa');
var logger = require('koa-logger');
var session = require('koa-generic-session');
var bodyparser = require('koa-bodyparser');
var route = require('koa-router');
var mongoose = require('mongoose');
var forceSSL = require('koa-force-ssl');
var https = require('https');
var fs = require('fs');

var config = require('./config');

mongoose.connect('mongodb://localhost/datagather');
mongoose.connection.on('error', function(err){
    console.error('Error connecting to db', err);
});

var app = koa();
app.use(forceSSL());
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

publicRoute.post('/auth', function*(){
    var user = this.request.body;
    try{
        var userBd = yield User.matchUser(user.username, user.password);
        this.session.user = userBd._id;
        this.status = 200;
    }
    catch(err){
        this.status = 403;
        console.error('/auth', err);
    }
});

app.use(publicRoute.middleware());

app.use(function* (next){
    if (this.session.user !== undefined)
        yield next;
    else
        this.status = 403;
});

var secureRoute = new route();

secureRoute.get('/lastLocation', function*(){
    this.body = {timestamp: yield User.getLastPositionTS(this.session.user)};
});

secureRoute.get('/lastWifi', function*(){
    this.body = {timestamp: yield User.getLastWifiTS(this.session.user)};
});

// [{lat: N, lon: N, timestamp: N}, ...]
secureRoute.post('/addLocation', function*(){
    var locations = this.request.body;
    this.body = {status: yield User.addLocationLogs(this.session.user, locations)};
});

// [{name: S, timestamp: N}, ...]
secureRoute.post('/addWifi', function*(){
    var wifi = this.request.body;
    this.body = {status: yield User.addWifiLogs(this.session.user, wifi)};
});

app.use(secureRoute.middleware());

//app.listen(process.argv[2] || 8000);

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    process.exit();
});

console.log('Listening on', process.argv[2] || 8443);

var options = {
	hostname: 'slayer.dyndns-ip.com',
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.crt')
}

https.createServer(options, app.callback()).listen(process.argv[2] || 8443);
