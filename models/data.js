'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var co = require('co');
var bcrypt = require('co-bcrypt');

var UserSchema = new Schema({
    username: {type: String, unique: true},
    password: String,
    locationLog: [new Schema({
        latitude: Number,
        longitude: Number,
        timestamp: Date
    }, {_id: false})],
    wifiLog: [new Schema({
        name: String,
        timestamp: Date
    }, {_id: false})]
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
    co(function *(){
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
    var user = yield this.findOne(id).exec();
    return user.locationLog[user.locationLog.length-1].timestamp;
};

UserSchema.statics.getLastWifiTS = function* (id){
    var user = yield this.findOne(id).exec();
    return user.wifiLog[user.wifiLog.length-1].timestamp;
};

UserSchema.statics.addLocationLogs = function* (id, logs){
    var user = yield this.findOne(id).exec();
    var sortedLogs = logs.sort(function(a, b){
        return a.timestamp - b.timestamp;
    });
    for (var i = 0; i < sortedLogs.length; ++i)
    {
        if (sortedLogs[i].timestamp > user.locationLog[user.locationLog.length -1].timestamp)
        {
            user.locationLog.concat(sortedLogs.slice(i));
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
    var user = yield this.findOne(id).exec();
    var sortedLogs = logs.sort(function(a, b){
        return a.timestamp - b.timestamp;
    });
    for (var i = 0; i < sortedLogs.length; ++i)
    {
        if (sortedLogs[i].timestamp > user.wifiLog[user.wifiLog.length -1].timestamp)
        {
            user.wifiLog.concat(sortedLogs.slice(i));
            user.save(function(err){
                if (err)
                    console.error(err);
            });
            return 'Done';
        }
    }
    return 'Unacceptable';
};

UserSchema.statics.addUser = function(username, password){
    var newUser = new User();
    newUser.username = username;
    newUser.password = password;
    newUser.save(function(err){
        if (err)
            console.error(err);
        else
            console.log('Created User', username);
    });
};

UserSchema.methods.comparePassword = function* (candidatePassword) {  
  return yield bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.matchUser = function* (username, password) {  
  var user = yield this.findOne({username: username}).exec();
  if (!user) 
      throw new Error('User not found');

  if (yield user.comparePassword(password))
    return user;

  throw new Error('Password does not match');
};

var User = mongoose.model('User', UserSchema);
module.exports = User;
