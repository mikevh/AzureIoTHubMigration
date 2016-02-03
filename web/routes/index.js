var config = require('../config');
var userAdmin = require('./users.js');

exports.index = function (req, res, loggedIn, admin, deviceList) {
    res.render('index', { title: 'Express', year: new Date().getFullYear(), devices: deviceList, loggedIn: loggedIn, admin: admin});
};

exports.login = function (req, res, loggedIn, admin) {
    res.render('login', { title: 'Login', year: new Date().getFullYear(), loggedIn: loggedIn, admin: admin });
};

exports.logout = function (req, res, loggedIn, admin) {
    res.clearCookie('OlfactomicsAuthCookie');
    res.render('login', { title: 'Logged out. Please login', year: new Date().getFullYear(), loggedIn: loggedIn, admin: admin });
};

exports.device = function (req, res, loggedIn, admin) {
    var device = req.params.id;
    res.render('device', { title: device, connectionStateUpdatedTime: new Date().getFullYear(), loggedIn: loggedIn, admin: admin });
};


function renderErrorPage(req, res, loggedIn, admin, errormessage) {
    res.render('errorpage', { message: errormessage, year: new Date().getFullYear(), loggedIn: loggedIn, admin: admin });
};

exports.admin = function (req, res, loggedIn, admin) {
    
    if (!admin)
        return renderErrorPage(req, res, true, req.isAdmin, "Access forbidden.");
    
    var device = req.params.id;
    userAdmin.listUsers(function (err, allusers) {
        if (err)
            return renderErrorPage(req, res, true, req.isAdmin, "Unable to list users.");
        
        res.render('users', { users: allusers, userstrings: JSON.stringify(allusers), year: new Date().getFullYear(), message: 'Your contact page', loggedIn: loggedIn, admin: admin });
    });
};

function parseUserFromPostData(req) {
    
    var devices = req.body.devices.split(",");
    var projects = req.body.projects.split(",");
    var isAdmin = (req.body.admin == "on" ? true : false);
    var user = {
        name: req.body.username,
        password: req.body.password,
        admin: isAdmin,
        devices: devices,
        projects: projects
    };
    return user;
}

exports.createuser = function (req, res, loggedIn, admin) {
    
    if (!req.isAdmin)
        return renderErrorPage(req, res, true, req.isAdmin, "User is not authorized to create new users.");
    
    userAdmin.createUser(parseUserFromPostData(req), 
    function (err, succ) {
        //redirect back to admin page
        if (!err)
            return res.redirect('/admin');
        
        renderErrorPage(req, res, true, req.isAdmin, err.message);
    });
};

exports.updateuser = function (req, res, loggedIn, admin) {
    if (!req.isAdmin)
        return renderErrorPage(req, res, true, req.isAdmin, "User is not authorized to modify users.");
    
    var updatedUser = parseUserFromPostData(req);
    updatedUser.id = req.params.id;
    
    userAdmin.updateUser(updatedUser, 

    function (err, succ) {
        if (!err)
            return res.redirect('/admin'); //redirect back to admin page
        
        renderErrorPage(req, res, true, req.isAdmin, err.message);
    });
};
