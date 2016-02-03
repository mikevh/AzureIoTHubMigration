
var User = require('../user'); // get our mongoose model

exports.listUsers = function (callback) {
    User.find({ /*admin: false*/}, callback);
};

exports.createUser = function (newUser, callback) {
    console.log("creating a new user: ",  newUser);
     
    User.findOne({
        name: newUser.name
    }, function (err, user) {
        
        if (err)
            return callback({ message: 'Failed to check existing users.' }, null);

        if (user)
            return callback({ message: 'User already exists.' }, null);
        
        var user = new User({
            name: newUser.name, 
            password: newUser.password,
            admin: newUser.admin,
            devices: newUser.devices,
            projects: newUser.projects
        });
        
        // save the user
        user.save(function (err) {
            if (err)
                return callback({ message: 'Failed to create user.' }, null);

            return callback(null, { message: user.id });
        });
    });
};

exports.updateUser = function (updatedUser, callback) {

    User.findByIdAndUpdate(updatedUser.id, {
        name: updatedUser.name, 
        password: updatedUser.password,
        admin: updatedUser.admin,
        devices: updatedUser.devices,
        projects: updatedUser.projects
    },
        function (err, usr) {
            if (err)
                return callback({ message: 'Failed to update user.' }, null);

            return callback(null, usr);
    });
};
