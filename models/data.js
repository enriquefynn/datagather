'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var co = require('co');
var bcrypt = require('co-bcrypt');

var UserSchema = new Schema({
    username: {type: String, unique: true},
    password: String,
    locationLog: [new Schema({
        lat: Number,
        lon: Number,
        timestamp: Date
    }, {_id: false})],
    wifiLog: [new Schema({
        name: String,
        timestamp: Date
    }, {_id: false})],
    lastWifiTS: {type: Date, default: 0},
    lastLocationTS: {type: Date, default: 0}
},
{
    toJSON: {
    transform: function (doc, ret, options){
        delete ret.password;
        delete ret.__v;
    }
  }
});

UserSchema.pre('save', function(done){
    if (!this.isModified('password'))
        return done();
    var user = this;
    co(function* (){
        try{
            var salt = yield bcrypt.genSalt();
            var hash = yield bcrypt.hash(user.password, salt);
            user.password = hash;
            done();
        }
        catch(err){
            done(err);
        }
    }).then(function(){
        done();
    },
    function(err){
        done(err);
    });
});

UserSchema.statics.getLastPositionTS = function* (id){
    var query = this.findById(id);
    query.select('lastLocationTS');
    return yield query.exec().lastLocationTS;
};

UserSchema.statics.getLastWifiTS = function* (id){
    var query = this.findById(id);
    query.select('lastWifiTS');
    return yield query.exec().lastWifiTS;
};

UserSchema.statics.addLocationLogs = function* (id, logs){
    var query = this.findById(id);
    query.select('locationLog lastLocationTS');
    var user = yield query.exec();
    var sortedLogs;
    if (logs.length <= 1)
        sortedLogs = logs;
    else
        sortedLogs = logs.sort(function(a, b){
            return a.timestamp - b.timestamp;
        });

    for (var i = 0; i < sortedLogs.length; ++i)
    {
        if (user.lastLocationTS === 0 ||
                sortedLogs[i].timestamp > user.lastLocationTS)
        {
            user.locationLog = user.locationLog.concat(sortedLogs.slice(i));
            user.lastLocationTS = sortedLogs[sortedLogs.length-1].timestamp;
            user.save(function(err){
                if (err)
                    console.error(err);
            });
            return 'Done';
        }
    }
    return 'Unacceptable';
};

UserSchema.statics.addWifiLogs = function* (id, logs){
    var query = this.findById(id);
    query.select('wifiLog lastWifiTS');
    var user = yield query.exec();
    var sortedLogs;

    if (logs.length <= 1)
        sortedLogs = logs;
    else
        sortedLogs = logs.sort(function(a, b){
            return a.timestamp - b.timestamp;
        });

    for (var i = 0; i < sortedLogs.length; ++i)
    {
        if (user.lastWifiTS === 0 || 
                sortedLogs[i].timestamp > user.lastWifiTS)
        {
            user.wifiLog = user.wifiLog.concat(sortedLogs.slice(i));
            user.lastWifiTS = sortedLogs[sortedLogs.length-1].timestamp;
            user.save(function(err){
                if (err)
                    console.error(err);
            });
            return 'Done';
        }
    }
    return 'Unacceptable';
};

UserSchema.methods.comparePassword = function* (candidatePassword) {  
	return yield bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.matchUser = function (username, password) {  
	var schema = this;
	return co(function*(){
        var query = schema.findOne({username: username});
        query.select('username password');
        var user = yield query.exec();

		if (!user)
		{
			console.log('Creating User');
			user = yield schema.create({username: username, password: password});
		}

		if (yield user.comparePassword(password))
			return user;
		throw new Error('Password does not match');
	});
}

var User = mongoose.model('User', UserSchema);
module.exports = User;
