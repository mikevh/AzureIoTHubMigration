var admin = {
    submitText: "Create",
    submitFormTitle: "Create User",
    editText: "Save",
    editFormTitle: "Editing User",


    editUser: function (userId) {
        var users = adminpageGetUsers();
        
        $("#userformcontainer").removeClass('hidden');
        $("#userform").attr("action", "users/update/" + userId);
        $("#formTitle").text(this.editFormTitle);
        $("#actionbtn").text(this.editText);

        for (var i = 0; i < users.length; i++) {
            if (users[i]._id == userId){
                this.populateForm(users[i]);
                break;
            }
        }
    },

    newUser: function () {
        this.clearForm();
        $("#userformcontainer").removeClass('hidden');
        $("#userform").attr("action", "users/create");
        $("#formTitle").text(this.submitFormTitle);
        $("#actionbtn").text(this.submitText);
    },

    populateForm: function(user){
        $("#username").val(user.name);
        $("#passwd").val(user.password);
        $("#deviceList").val(user.devices.join(' ,'));
        $("#projectList").val(user.projects.join(' ,'));
        
        if(user.admin){
            $('#admin').prop('checked', true);
        }else{
            $('#admin').prop('checked', false);
        }
    },

    clearForm: function () {
        $("#username").val("");
        $("#passwd").val("");
        $("#deviceList").val("");
        $("#projectList").val("");
        $('#admin').prop('checked', false);
    }
};
