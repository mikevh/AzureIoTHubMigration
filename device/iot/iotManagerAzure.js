var clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var fs = require('fs');

var azureConfig;
var azureDevice;
var azureClient;
var messagetypes = [];
var callbacks = [];

var session = new Session();

function Session() {
}

Session.prototype.onMessage = function(type, callback) {
    messagetypes.push(type.type);
    callbacks.push(callback);
}

function authenticate(config) {
    azureConfig = config;
    azureClient = new clientFromConnectionString(config.api_key);
    return azureClient;
}

function createDevice(obj) {
    azureDevice = obj;
    return obj;   
}

function connect(service, device, callback) {
    azureClient.getReceiver(function(receiver) {
      receiver.on('message', function(msg) { 
        receiver.complete(msg, print);
        var data = JSON.parse(msg.getData());
        data.id = 1;
        for (var c = 0; c<messagetypes.length;c++) {
            if (messagetypes[c] == data.type) {
                callbacks[c](data);
            }
        }
      });
    });
    callback(null,session,azureDevice);
}

function print(err) {
    if (err) {
        console.log("Azure server error",err.toString());

        //workaround to "not authorized" -problem
        if (err.toString() == "Error: Unauthorized") {
            authenticate(azureConfig);
        }
    };
}

function sendMessage(msg,callback) {
    var data = JSON.stringify({
        deviceId: msg.to,
        type: msg.type,
        body: msg.body
    });
    var message = new Message(data);
    azureClient.sendEvent(message, function(err,res) {
        console.log("azure send message", err, "body", data);
        var array = [];
        array.push(msg);
        callback(err,array);
    });
}

module.exports.authenticate = authenticate;
module.exports.createDevice = createDevice;
module.exports.connect = connect;
module.exports.sendMessage = sendMessage;
