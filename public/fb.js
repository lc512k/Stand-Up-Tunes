/* global FB, window, document */

function onConnected() {

    var loginData = {
        id: null,
        url: null,
        name: null
    };

    FB.api('/me', function (response) {
        loginData.name = response.first_name;
        loginData.id = response.id;

        FB.api('/me/picture', function (response) {
            loginData.url = response.data.url;

            socket.emit('login', loginData);
            socket.emit('init');

        });

    });

}

function statusChangeCallback(response) {

    if (response.status === 'connected') {
        onConnected();
    }
    else {
        //alert('Sign in with Facebook');
    }
}

function checkLoginState() {
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
}

document.getElementById('fbbutton').addEventListener('click', function () {

    FB.login(function (response) {
        if (response.authResponse) {
            onConnected();
        }
        else {
            alert('Oops! Cheap alert!');
        }
    });

});

window.fbAsyncInit = function () {

    FB.init({
        appId      : '1525734764370544',
        cookie     : true,
        xfbml      : true,
        version    : 'v2.1'
    });

    checkLoginState();
};

// Load the SDK asynchronously
(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = "//connect.facebook.net/en_US/sdk.js";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
