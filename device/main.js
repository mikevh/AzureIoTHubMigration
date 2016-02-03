"use strict";
var config = require('./config');
var iot = require('./iot/iotManager');

var status = {text: 'Online'};
var service = new iot.Service(config);
startSensorControl();

// ************************************************************************
// Master function. Creates iot device and connects to iot service
// Creates handlers for different messages
// ************************************************************************
function startSensorControl() {
    console.log("starting");

    var deviceToConnect = new iot.Device({nickname: config.devicename,
            name: config.devicename,
            tags: ['executes:_startAnalysis'],
            api_key: config.api_key});

    service.connect(deviceToConnect, function(err, session, device) {
        if (err) return console.log('failed to connect to service: ' + err);
        console.log(device.name + ' waiting for commands with id ', device,session);

        // handle ping command. Web UI is using this to make sure that it can
        // communicate with remote device
        session.onMessage({ type: '_ping' }, function(message) {
            console.log('received ping for',message);
            var msg = new iot.Message({type: '_pong', to: config.devicename, body: message.id});
            msg.send(session, function(err,sentMessages) {
            });            
        });
        session.onMessage({ type: '_analysisStart' }, function(message) {
            console.log('_analysisStart:',message);
            setStatus(session, 'Scanning');
            var percent = 0;
            var intervalTimer = setInterval(function() {
                setStatus(session, 'Scanning ' + percent + '%');
                percent++;
                if (percent > 100)
                    clearInterval(intervalTimer);
            },300);
        });
        
        var msg = new iot.Message({type: '_ping', to: config.devicename, body: ''});
        msg.send(session, function(err,sentMessages) {
        });            

    });
}

// ************************************************************************
// setStatus to web UI. Actually this sends iot message with _status type
// @text = status text as string
// ************************************************************************
function setStatus(session, text) {
    status.text = text;
	var msg = new iot.Message({type: '_status', to: config.devicename, body: {status: status}});
	msg.send(session, function(err,sentMessages) {
	});
}

