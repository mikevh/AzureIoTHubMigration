function getStatus(device) {
    $.ajax({
        url: '/devicestate/' + device,
        dataType: 'JSON',
        success: function (data, status, jqXHR) {
            var statusObject = JSON.stringify(data.result);
            $('#' + device).html(data.deviceState);
        }
    });
};
function getStatusws(device) {
    var ws = new WebSocket("ws://localhost:8080");
    $('#' + device).html("Disconnected");
    ws.onopen = function () {
        var cookie = Cookies.get("OlfactomicsAuthCookie");
        console.log(cookie);
        ws.send(JSON.stringify({ type: "auth", token: cookie }));
        $.ajax({
            url: '/devicestate/' + device,
            dataType: 'JSON',
            success: function (data, status, jqXHR) {
            }
        });
    }
    ws.onmessage = function (evt) {
        var received_msg = evt.data;
        console.log("Device ws.onmessage", evt.data);
        var json = JSON.parse(received_msg);
        if (json.type == "_pong") {
            if (json.deviceId == device) {
                $('#' + device).html("Connected");
            }
        }
    }
};

function updateStatusws(device) {
    var ws = new WebSocket("ws://localhost:8080");
    $('#status').html("waiting");
    ws.onopen = function () {
        var cookie = Cookies.get("OlfactomicsAuthCookie");
        console.log(cookie);
        ws.send(JSON.stringify({ type: "auth", token: cookie }));
    }
    ws.onmessage = function (evt) {
        var received_msg = evt.data;
        console.log("Device ws.onmessage", evt.data);
        var json = JSON.parse(received_msg);
        if (json.type == "_status") {
            if (json.deviceId == device) {
                $('#status').html(json.body.status.text);
            }
        }
    }
}

function sendMessage(device) {
    var patientId = $('#patientid').val();
    $.post('/sendMessage/' + device,
    {
        type: "_analysisStart",
        body: { patientid: patientId }
    },
    function (data, status) {
    });
};
