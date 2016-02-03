"use strict";
var config = require('../config');

var iot = null;

function Service(config) {
    console.log("service config");
    if (config.iotService == "nitrogen") {
        var service = require('./iotManagerNitrogen.js');
        iot = new service.Service(config);

    }
    else if (config.iotService == "azure") {
        var service = require('./iotManagerAzure.js');
        iot = new service.Service(config);
    }
};


Service.prototype.needsAuthentication = function() {
    return iot.needsAuthentication();
}

Service.prototype.authenticate = function(user, callback) {
    iot.authenticate(user, callback);
}

Service.prototype.verify = function(token, callback) {
    iot.verify(token,callback);
}

Service.prototype.receiveMessages = function(callback) {
    iot.receiveMessages(callback);
}

Service.prototype.getDevices = function(callback) {
    iot.getDevices(callback);
}

Service.prototype.sendMessage = function(to, msg, callback) {
    iot.sendMessage(to, msg, callback);
}

module.exports.Service = Service;
