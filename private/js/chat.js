$(document).ready(function() {
    "use strict";

    /* This happens when the document is loaded. We start off with http://localhost:8000
       And if the browser supports this, we get a new connection as wellat:
       ws://localhost:8000
     */
    let socket = io.connect('/');

    socket.on('user_joined', function(data) {
        let beginTag = "<p style='color: bisque;'>";
        let numOfUsers = data.numOfUsers;
        let userStr = "";
        if(numOfUsers == 1) {
            userStr = "user";
        } else {
            userStr = "users";
        }
        if(numOfUsers < 2) {

            $("#chat_content").append("<p>Just you, no one else.</p>");

        } else {

            $("#chat_content").append(beginTag + data.user
                + " connected. There are " + numOfUsers + " " + userStr + ".</p>");

        }

    });

    socket.on('user_left', function(data) {
        let beginTag = "<p style='color: burlywood;'>";
        let numOfUsers = data.numOfUsers;
        let userStr = "";
        if(numOfUsers == 1) {
            userStr = "user";
        } else {
            userStr = "users";
        }
        if(numOfUsers < 2) {

            $("#chatContent").append("<p>" + data.user + " left. You are now all alone on this chat server <span style='font-size: 1.2em; color: blue;'>☹</span>.</p>");


        } else {

            $("#chatContent").append(beginTag + data.user
                + " left. Now chatting with " + numOfUsers + " " + userStr + "</p>");

        }

    });

    // this is from others - not our text
    socket.on('chatting', function(data) {
        //console.log(data);
        let beginTag = "<p>";
        if(data.event) {
            $("#chatContent").append("<p style='color: orange;'>" + data.event + "</p>");
        }
        $("#chatContent").append(beginTag + data.user + " said: " + data.text + "</p>");

    });


    $("#send").click(function() {

        let text = $("#msg").val();

        // check if the name is blank, shouldn't be
        if(text == null || text === "") {
            $("#msg").fadeOut(50).fadeIn(50).fadeOut(50).fadeIn(50);
            return;
        }
        socket.emit('chatting', {"name": name, message: text});
        $("#msg").val("");
    });

});