var config;
var nitrogen = require('nitrogen');

var service = null;
var session = null;
var principal = null;
var ready = 0;

function Service(_config) {
    config = _config;
};

Service.prototype.receiveMessages = function(callback) {
    var self = this;
	var now = Date.now()-5000;
    setInterval(function() {
        nitrogen.Message.find(session,{type: {$ne: "_ping"}, ts: {$gt: now}},{limit: 20, sort:{ts: -1}},function(err, messages) {
            if (err == null && callback != null && messages.length > 0) {
                messages.forEach(function(msg) {
                    console.log(msg.id);
                    var id = msg.to;
                    self.getNameById(id, function(err, name){
                        msg.to = name;
                        msg.deviceId = name;
                        var reply = {Bytes: msg}
                        callback(reply);
                    });
                    var now2 = new Date(msg.ts);
                    if (now2 > now)
                        now = now2;
                });
            }
        });
    },300);

}

Service.prototype.getNameById = function(id, callback) {
    this.getDevices(function(err, principals) {
        if (err) {callback(err,null);}
        principals.forEach(function(obj) {
            if (obj.id == id) {
                callback(err, obj.deviceId);
            }
        });
    });
}

Service.prototype.getIdByName = function(name, callback) {
    this.getDevices(function(err, principals) {
        if (err) {callback(err,null);}
        principals.forEach(function(obj) {
            if (obj.deviceId == name) {
                callback(err, obj.id);
            }
        });
    });
}

Service.prototype.getDevices = function(callback) {
    nitrogen.Principal.find(session, {type: "device"},null,function(err,principals) {
        var str = JSON.stringify(principals);
        str = str.replace(/\"name\"/g, '\"deviceId\"');
        str = JSON.parse(str);
        callback(err,str);
    });
}

Service.prototype.sendMessage = function(to, msg, callback) {
    console.log("trying to send message", ready);
    var sent = 0;
    this.getDevices(function(err, principals) {
        principals.forEach(function(obj) {
            if (obj.deviceId == to && sent == 0) {
                var message = new nitrogen.Message({
                    type: msg.type,
                    to: obj.id,
                    body: msg.body
                });
                message.send(session, function (err,sentMessages) {
//                    console.log('message sent',err, err == null ? sentMessages[0].body : null);
                    sent = 1;
                    callback(err, err == null ? sentMessages[0] : null);
 
                });
                
            }
        });
    });

}

Service.prototype.needsAuthentication = function() {
    return true;
}
Service.prototype.authenticate = function(user,callback) {
    var self = this;
    console.log("authenticating");
    nitrogenService = new nitrogen.Service(config.nitrogen);
    var user = new nitrogen.User({
        nickname: 'current',
        email: user.name,
        password: user.password
   });
   nitrogenService.authenticate(user, function (err, _session, _principal) {
      if (err) { callback(err, null,null); return; }
      session = _session;
      console.log("AUTHENTICATION SUCCEEDED");
      principal = _principal;
        callback(null, principal, session.accessToken);
        ready = 1;
        session.onMessage({type: '_pong'}, function(msg) {
            console.log("MESSAGE COMING::::::::");
            self.getNameById(msg.id, function(err, name){
                msg.to = name;
                msg.deviceId = name;
                var reply = {Bytes: msg}
                console.log(reply);
                callback(reply);
            });
        });
      return;
   });

}

Service.prototype.verify = function(token,callback) {
    console.log("verifying",token);
    if (token == null || token == undefined) {
        callback("error verifying token", null, null);
        return;
    }
    try {
        nitrogenService = new nitrogen.Service(config.nitrogen);
        var user = new nitrogen.User({
            accessToken: {
            token: token.token
        },
        id: token.principal
     });
     nitrogenService.resume(user, function (err, _session, _principal) {
        if (err) { callback(err, null,null); return; }
        session = _session;
        principal = _principal;
        console.log("RESUMED with token", _session.accessToken);
            callback(null, principal, session.accessToken);
            ready = 1;
        return;
     });
   }
   catch (err) {
     callback(err, null, null);
   }
}
module.exports.Service = Service;
