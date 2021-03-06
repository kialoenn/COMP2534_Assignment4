'use strict';
$(function () {
    $('#loginForm').on('submit', function (evt) {
        evt.preventDefault();
        let userInput = {
            username: $("#account").val(),
            password: $("#password").val()
        }
        console.log(userInput);

        $.ajax({
            url: '/authentication',
            type: 'POST',
            dataType: 'JSON',
            data: userInput,
            success: function (doc) {
                if (doc.status == 'success') {
                    window.location.replace('/main')
                    console.log("login");
                } else if(doc.status == 'new') {
                    $("#loginMessage").html(doc.msg);
                    setTimeout(function(){window.location.replace('/main');}, 1000)
                }
                else {
                    $("#loginMessage").html(doc.msg);
                }
            }
        })

    })
})