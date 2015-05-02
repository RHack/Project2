"use strict";

var user = {
    token: null,
    send: {
        register: function(){
            socket.emit("user:register",{email:$("div#signIn input#email").val(),password:$("div#signIn input#password").val()});
        },
        signin: function(){
            socket.emit("user:signin",{email:$("div#signIn input#email").val(),password:$("div#signIn input#password").val()});
        },
        settings: function(){
            socket.emit("user:settings",{email:$("div#userSettings input#email").val(),displayname:$("div#userSettings input#displayname").val()});
        },
        changePassword: function(){
            socket.emit("user:changepassword",{oldpassword:$("div#changePassword input#oldpassword").val(),newpassword:$("div#changePassword input#oldpassword").val(),confirmpassword:$("div#changePassword input#confirmpassword").val()});
        }
    },
    modal: {
        signin: $( "div#signIn" ).dialog({
            autoOpen: false,
            width: "40%",
            modal: true,
            buttons: {
                "Register": function(){
                    console.log("Register Func");
                    user.send.register();
                },
                "Sign in": function(){
                    console.log("Signin Func");
                    user.send.signin();
                }
            },
            close: function() {
                // Clear form data too
                $("div#signIn input#email").val("");
                $("div#signIn input#password").val("");
                user.modal.signin.dialog( "close" );
            }
        }),
        settings: $("div#userSettings").dialog({
            autoOpen: false,
            width: "40%",
            modal: true,
            buttons: {
                "Update": function(){
                    console.log("Update Settings Func");
                    user.send.settings();
                }
            },
            close: function() {
                user.modal.settings.dialog( "close" );
            }
        }),
        changePassword: $("div#changePassword").dialog({
            autoOpen: false,
            width: "40%",
            modal: true,
            buttons: {
                "Update": function(){
                    console.log("Change Password Func");
                    user.send.changePassword();
                }
            },
            close: function() {
                // Clear form data too
                $("div#changePassword input#oldpassword").val("");
                $("div#changePassword input#newpassword").val("");
                $("div#changePassword input#confirmpassword").val("");
                user.modal.changePassword.dialog( "close" );
            }
        })
    },
    eventHandlers: function () {
        // Override nav clicks
        $("a#signinLink").on("click", function(event) {
            event.preventDefault();
            user.modal.signin.dialog("open");
        });
        $("a#settingsLink").on("click", function(event) {
            event.preventDefault();
            user.modal.settings.dialog("open");
        });
        $("a#changepasswordLink").on("click", function(event) {
            event.preventDefault();
            user.modal.changePassword.dialog("open");
        });
        $("a#logoutLink").on("click",function(event){
            event.preventDefault();
            socket.emit("user:logout",{});
            $("li.guest").removeClass("hidden");
            $("li.user").addClass("hidden");
            //TODO: Clear local storage too
            localStorage.clear();
        });
        // Override pressing enter/submit in modal forms
        // REF: https://jqueryui.com/dialog/#modal-form
        user.modal.signin.find("form").on("submit",function(event){
            event.preventDefault();
            // Assuming pressing enter because user is logging in, must use mouse to register
            user.send.signin();
        });
        user.modal.settings.find("form").on("submit",function(event){
            event.preventDefault();
            user.send.settings();
        });
        user.modal.changePassword.find("form").on("submit",function(event){
            event.preventDefault();
            user.send.changePassword();
        });
        // Socket event capturing
        socket.on("user:trigger",function(msg){
            if(typeof msg.settings === "boolean" && msg.settings === true) {
                // Pop up "settings" modal to get user to set their Displayname
                user.modal.settings.dialog("open");
            } else if(typeof msg.settings === "boolean" && msg.settings === false) {
                user.modal.settings.dialog("close");
            }
        });
        socket.on("user:error",function(msg){
            // Display generic error message in some fashion
            $("div#user-error p").replaceWith(
                $("<p>").append(msg.error)
            );
            $( "div#user-error" ).dialog({
                modal: true,
                buttons: {
                    Ok: function() {
                        $( this ).dialog( "close" );
                    }
                }
            });
        });
        socket.on("user:signinError",function(msg){
            console.log({msg:msg,email:typeof msg.email});
            if(typeof msg.email === "boolean" && msg.email === true){
                $("input#email").parent().addClass("has-error");
            }
            if(typeof msg.password === "boolean" && msg.password === true){
                $("input#password").parent().addClass("has-error");
            }
            if(typeof msg.displayname === "boolean" && msg.displayname === true){
                $("input#displayname").parent().addClass("has-error");
            }
            if(typeof msg.token === "boolean" && msg.token === true){
                $("li.guest").removeClass("hidden");
                $("li.user").addClass("hidden");
                localStorage.clear();
            }
        });
        socket.on("user:setToken",function(msg){
            // Store token in local storage
            // REF: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
            localStorage.setItem("token",msg.token);
            user.token = msg.token;
            // Close modal login screens
            user.modal.signin.dialog("close");
            // Toggle nav menus
            $("li.guest").addClass("hidden");
            $("li.user").removeClass("hidden");
            $("input").parent().removeClass("has-error");
        });
        socket.on("user:accountInfo",function(msg){
            console.log({msg:msg});
            $("input#email").val(msg.email);
            if(typeof msg.displayname !== "undefined"){
                $("input#displayname").val(msg.displayname);
            }
        });
    }
};
$(document).ready(function () {
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
    socket.emit("user:checkToken",{token:localStorage.getItem("token")});
    user.eventHandlers();
    socket.emit("user:","Test");
});
