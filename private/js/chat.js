$(document).ready(function() {
    "use strict";

// connect to  scoket.io

$("#room1Button").on('click', function(e) {
    e.preventDefault();
    $('#chatWindow').html('<div id="chatContent"></div><form id="chatForm"><textarea id="msg" placeholder="Your message here"></textarea><input type="button" id="send" value="Send" /></form>')
    let socket = io.connect('/');
    document.getElementById("room1Button").disabled = true;
    document.getElementById("disconnect").disabled = false;

    socket.emit('addUser', $("#name").text());

    socket.on('user_joined', function(data) {
        let numOfUsers = data.numOfUsers;
        let userStr = "";
        if(numOfUsers == 1) {
            userStr = "user";
        } else {
            userStr = "users";
        }
        if(numOfUsers < 2) {

            $("#chatContent").append("<p style='text-align: center;'>Please wait for someone to join.</p>");

        } else {

            $("#chatContent").append("<p style='color: green; text-align: center;'>&#128526;" + data.user
                + "&#128526; connected. There are " + numOfUsers + " " + userStr + ".</p>");

        }

    });

    $('#disconnect').on('click', function(e) {
        e.preventDefault();
        socket.disconnect();
        document.getElementById("room1Button").disabled = false;
        document.getElementById("disconnect").disabled = true;
        $('#chatWindow').html('<div id="tips"><h2>Please select chat room on the left to connect</h2></div>')
    })
    socket.on('user_left', function(data) {
        let numOfUsers = data.numOfUsers;
        let userStr = "";
        if(numOfUsers == 1) {
            userStr = "user";
        } else {
            userStr = "users";
        }
        if(numOfUsers < 2) {

            $("#chatContent").append("<p style='color: red; text-align: center;'>" + data.user + " left. Please wait for others to join &#128557;</p>");


        } else {

            $("#chatContent").append("<p style='color: red; text-align: center;'>" + data.user
                + " left. Now chatting with " + numOfUsers + " " + userStr + "</p>");

        }

    });

    // this is from others - not our text
    socket.on('chatting', function(data) {
        let beginTag = "<b>";
        if ($("#name").text() == data.user) {
            beginTag = "<p style='color: deepskyblue;'><b>";
            $("#chatContent").append(beginTag + data.user + "</b>: " + data.text + "</p>");
        } else {
            $("#chatContent").append("<p style='text-align: right;'>" + data.text + " :" + beginTag + data.user + "</b></p>");
        }
        if(data.event) {
            $("#chatContent").append("<p style='color: orange;'>" + data.event + "</p>");
        }
        

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
})


});