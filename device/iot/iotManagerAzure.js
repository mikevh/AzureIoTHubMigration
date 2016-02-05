var Amqp = require('azure-iot-device-amqp').Amqp;
var Client = require('azure-iot-device').Client;
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
    azureClient = Client.fromConnectionString(config.api_key, Amqp);
    return azureClient;
}

function createDevice(obj) {
    azureDevice = obj;
    return obj;   
}

function connect(service, device, callback) {
    var connectCallback = function(err) {
        console.log("iotManagerAzure Connected");
        callback(null,session,azureDevice);
        azureClient.on('message', function (msg) {
            azureClient.complete(msg, print('completed'));
            var data = JSON.parse(msg.getData());
            console.log("iotManagerAzure received message", data);
            data.id = 1;
            for (var c = 0; c<messagetypes.length;c++) {
                if (messagetypes[c] == data.type) {
                    callbacks[c](data);
                }
            }
        });

        azureClient.on('error', function(err) {
            console.log("iotManagerAzure error", err.message);
        });

        azureClient.on('disconect', function() {
            console.log("iotManagerAzure disconnected");
            azureClient.removeAllListeners();
            azureClient.connect(connectCallback);
        });
    };

    azureClient.open(connectCallback);
}

function print(err) {
    if (err) {
        console.log("Azure server error",err.toString());
    }
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
