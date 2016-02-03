"use strict";
var iot;
var service;

function Service(config) {
    if (config.iotService == "azure") {
        iot = require('./iotManagerAzure.js');
    }
    else if (config.iotService == "nitrogen") {
        iot = require('./iotManagerNitrogen.js');
    }
    service = iot.authenticate(config);
};

Service.prototype.connect = function(device, callback) {
    console.log("Connecting...");
    iot.connect(service, device, callback);
};

function Message(obj) {
    this.obj = obj;
};

Message.prototype.send = function(session, callback) {
    iot.sendMessage(this.obj,callback);
};

function Device(obj) {
    this.obj = iot.createDevice(obj);
};

module.exports.Service = Service;
module.exports.Message = Message;
module.exports.Device = Device;
