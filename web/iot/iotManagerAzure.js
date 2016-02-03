var iothub = require('azure-iothub');
var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;
var config;
var EventHubClient = require('../lib/eventhubclient.js');


function Service(_config) {
    config = _config;
};

Service.prototype.needsAuthentication = function() {
    return false;
}
Service.prototype.authenticate = function(user,callback) {
    callback(null, user);
}

Service.prototype.receiveMessages = function(callback) {
    var startTime = Date.now();
    var ehClient = new EventHubClient(config.connectionString, 'messages/events/');
    ehClient.GetPartitionIds().then(function(partitionIds) {
        partitionIds.forEach(function(partitionId) {
            ehClient.CreateReceiver('$Default', partitionId).then(function(receiver) {
                receiver.StartReceive(startTime)
                .then(function() {
                    receiver.on('error', function(error) {
                        serviceError(error.description);
                    });
                    receiver.on('eventReceived', function(eventData) {
                        if (eventData.SystemProperties['x-opt-enqueued-time'] >= startTime) {
                            console.log("RECEIVED MESSAGE",eventData);
                            callback(eventData);
                        } 
                        // TODO: else mark as completed to keep event count small
                        // TODO: Use filtered receiver
                    });
                });
                return receiver;
            });
        });
        return partitionIds;
    });
}

Service.prototype.getDevices = function(callback) {
    var registry = iothub.Registry.fromConnectionString(config.connectionString);

    registry.list(function (err, deviceList) {
        callback(err, deviceList);
    });
}


Service.prototype.sendMessage = function(to, msg, callback) {
    var client = Client.fromConnectionString(config.connectionString);
    client.open(function (err) {
        if (err) { 
            return;
        }
        client.send(to, msg, function (err) {
            client.close();
            callback(err, msg);
        });
    });
}
module.exports.Service = Service;
