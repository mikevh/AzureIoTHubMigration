var nitrogen = require('nitrogen');
var fs = require('fs');

var nitrogenConfig;
var nitrogenSession;
var nitrogenId;

function authenticate(config) {
    nitrogenConfig = config;
    return new nitrogen.Service(config);
}

function createDevice(obj) {
    var device = new nitrogen.Device(obj);
    return device;
}

function connect(service, device, callback) {
    service.connect(device.obj, function(err, session, device) {
        nitrogenSession = session;
        nitrogenId = device.id;
        callback(err, session, device);
    });
}

function sendMessage(obj,callback) {
    var message = new nitrogen.Message(obj);
    message.to = nitrogenId;
    message.send(nitrogenSession, function (err,sentMessages) {
		callback(err,sentMessages);
    });
}

module.exports.authenticate = authenticate;
module.exports.createDevice = createDevice;
module.exports.connect = connect;
module.exports.sendMessage = sendMessage;
