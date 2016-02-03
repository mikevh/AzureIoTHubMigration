var express = require('express');
var routes = require('./routes');
var http = require('http');
var cookieparser = require('cookie-parser');
var path = require('path');
var config = require('./config');
var iot = require('./iot/iotManager');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var User = require('./user'); // get our mongoose model
var userAdmin = require('./routes/users.js');
var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: 8080 });

// Webpage communicates with websocket when updating status of devices. Websocket connections are stored here
var ws_connections = [];

// connect to database to manage users and auth with Azure IoT Hub
mongoose.connect(config.database);

// Connect to IoT Service
var service = new iot.Service(config);

// Receive IoT Device to cloud messages here and send to websockets
service.receiveMessages(function (eventData) {
    for (var x = 0; x < ws_connections.length; x++) {
        ws_connections[x].send(JSON.stringify(eventData.Bytes));
    }
});

// Initialize express
var app = express();
var appRoutes = express.Router();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cookieparser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('superSecret', config.secret);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// This is websocket connection and authentication handling.
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        // get token and if verification is ok, add connection to listeners
        // TODO: this is working still after token is expired
        var json = JSON.parse(message);
        if (json.type == "auth") {
            var token = json.token;
            console.log('received: %s', message, token);
            if (service.needsAuthentication() && token != null) {
                console.log("Token verification against service");
                var token = JSON.parse(token);
                service.verify(token, function (err, user, token) {
                    if (err) {
                    } else {
                        ws_connections.push(ws);
                    }
                });
            }
            else {
                jwt.verify(token, config.secret, function (err, decoded) {
                    if (err) {
                    } else {
                        ws_connections.push(ws);
                    }
                });
            }
        }
        else {
            console.log(json);
        }
	
    });
    ws.on('close', function () {
        var index = ws_connections.indexOf(ws);
        if (index > -1) {
            ws_connections.splice(index, 1);
        }
    });
});

// Utility to check if user is admin
function adminCheck(req, res, failMessage) {
    if (!req.authenticatedUser.admin) {
        res.json({ success: false, message: failMessage });
        return false;
    }
    return true;
};

// route to authenticate a user (POST http://localhost/authenticate)
appRoutes.post('/authenticate', function (req, res) {
    // with some iot solutions we need to authenticate user against it and sometimes we manage it ourselves
    if (service.needsAuthentication()) {
        console.log("Authentication against iot service");
        service.authenticate(req.body, function (err, user, token) {
            if (err)
                console.log(err);
            if (!user) {
                res.render('login', { title: 'Login', error: 'Invalid credentials', loggedIn: false, admin: false });
            }
            else if (user) {
                res.cookie('OlfactomicsAuthCookie', JSON.stringify(token), { maxAge: 900000, httpOnly: false });
                console.log('cookie created successfully');
                return res.redirect('/');
            }
        });
    }
    else {
        console.log(req.body);
        // find the user
        User.findOne({
            name: req.body.name
        }, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                res.render('login', { title: 'Login', error: 'Authentication failed. User not found.', loggedIn: false, admin: false });
            }
            else if (user) {
                // check if password matches
                if (user.password != req.body.password) {
                    res.render('login', { title: 'Login', error: 'Authentication failed. User not found.', loggedIn: false, admin: false });
                }
                else {
                    // if user is found and password is right
                    // create a payload
                    var payload = {
                        id: user.id
                    };
                    // create a token and add payload
                    var token = jwt.sign(payload, app.get('superSecret'), {
                        expiresInMinutes: 1440 // expires in 24 hours
                    });
                    // return the information including token as JSON
                    // no: set a new cookie
                    res.cookie('OlfactomicsAuthCookie', token, { maxAge: 900000, httpOnly: false });
                    console.log('cookie created successfully');
                    return res.redirect('/');
                }
            }
        });
    }
});

// Route middleware to verify a token
// All routes beyond this point require authentication
appRoutes.use(function (req, res, next) {
    console.log("verify a token");
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    
    if (req.cookies != null && token == null) {
        var cookie = req.cookies.OlfactomicsAuthCookie;
        if (cookie === undefined) {
        } 
        else {
            // yes, cookie was already present 
            console.log('cookie exists', cookie);
            token = cookie;
        }
    }
    // decode token
    if (token) {
        if (service.needsAuthentication()) {
            console.log("Token verification against s service");
            service.verify(JSON.parse(token), function (err, user, token) {
                if (err)
                    console.log(err);
                
                if (!user) {
                    res.render('login', { title: 'Login', error: 'Invalid credentials', loggedIn: false, admin: false });
                }
                else if (user) {
                    req.authenticatedUser = user;
                    next();
                }
            });
        }
        else {
            // verifies secret and checks exp
            jwt.verify(token, app.get('superSecret'), function (err, decoded) {
                if (err) {
                    res.render('login', { title: 'Login', error: 'Failed to authenticate a token', loggedIn: false, admin: false });
                }
                else {
                    // if everything is good, save decoded payload to request for use in other routes
                    console.log("decoded", decoded);
                    User.findOne({
                        '_id': decoded.id
                    }, function (err, user) {
                        if (err)
                            throw err;
                        if (!user) {
                            res.render('login', { title: 'Login', error: 'Authentication failed. User not found.', loggedIn: false, admin: false });
                        }
                        else if (user) {
                            req.authenticatedUser = user;
                            req.isAdmin = user.admin
                            next();
                        }
                    });
                }
            });
        }
    } 
    else {
        routes.login(req, res,false,false);
    }
});

// routes
// Get index page which show all devices
appRoutes.get('/', function (req, res) {
    service.getDevices(function (err, deviceList) {
        routes.index(req, res, true, req.isAdmin, deviceList);
    });
});

// Handle login
appRoutes.get('/login', function (req, res) {
    routes.login(req, res, true, req.isAdmin);
});

// Handle logout
appRoutes.get('/logout', function (req, res) {
    routes.logout(req, res, false, req.isAdmin);
});

// Get device UI with specific device
appRoutes.get('/device/:id', function (req, res) {
    routes.device(req, res, true, req.isAdmin);
});

// GET handler which sends _ping message to device
appRoutes.get('/devicestate/:id', function (req, res) {
    var device = req.params.id;
    service.sendMessage(device, { "type": "_ping", "body": "hello" }, function (err, message) {
        console.log("sending message", err, message);
    });
    res.json({ deviceId: device });
});

// POST handler for sending new message 
appRoutes.post('/sendMessage/:id', function (req, res) {
    service.sendMessage(req.params.id, req.body, function (err, message) {
        return res.json('ok');
    });
});

// Get admin page
appRoutes.get('/admin', function (req, res) {
    routes.admin(req, res, true, req.isAdmin);
});

// POST handler for creating a new user 
appRoutes.post('/users/create', function (req, res) {
    routes.createuser(req, res, true, req.isAdmin);
});

// POST handler for updating an existing user 
appRoutes.post('/users/update/:id', function (req, res) {
    routes.updateuser(req, res, true, req.isAdmin);
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

app.use('/', appRoutes);
