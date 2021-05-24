"use strict";
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
const fs = require('fs');
const {
    JSDOM
} = require('jsdom');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'logs')
});

app.use(morgan(':referrer :url :user-agent', {
    stream: accessLogStream
}));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use('/js', express.static('private/js'));
app.use('/css', express.static('private/css'));
app.use('/html', express.static('private/html'));
app.use('/img', express.static('private/img'));

app.use(session({
    secret: 'N7nmaJZO7fErrVuGE1Umxyf3G57l5ruK',
    name: 'NatureGoChitChat',
    resave: false,
    saveUninitialized: true
}));

app.get('/', function (req, res) {
    let file = fs.readFileSync('./private/html/index.html', 'utf8');
    initDB();
    res.send(file);
})




async function initDB() {

    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS Team25;
        use Team25;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        account varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));`;

    await connection.query(createDBAndTables);
    let results = await connection.query("SELECT COUNT(*) FROM user");
    let count = results[0][0]['COUNT(*)'];

    if (count < 1) {
        results = await connection.query("INSERT INTO user (account, password) values ('Arron', 'admin')");
        console.log("Added one user record.");
    }
    connection.end();
}

app.post('/authentication', async function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    console.log("Email", req.body.username);
    console.log("Password", req.body.password);
    let result = await checkUser(req.body.username, req.body.password);
    if (result.status == 'wrongPassword') {
        res.send({
            status: "fail",
            msg: "Password is not correct"
        })
    } else if (result.status == 'newUser') {
        req.session.loggedIn = true;
        req.session.account = result.data.account;
        req.session.save();
        res.send({
            status: "new",
            msg: "Created a new Account!"
        })
    } else {
        req.session.loggedIn = true;
        req.session.account = result.data.account;
        req.session.save();
        res.send({
            status: "success",
            msg: "Logged in!"
        })
    }

})

async function checkUser(user, password) {
    return new Promise(function (resolve) {
        const mysql = require('mysql2');
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Team25'
        });
        console.log('user: ' + user);
        connection.connect();
        connection.query(
            "SELECT * FROM user WHERE account = ?", [user],
            function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.length > 0) {
                    if (result[0].password == password) {
                        resolve({
                            status: 'found',
                            data: result[0]
                        });
                    } else {
                        resolve({
                            status: 'wrongPassword'
                        });
                    }
                } else {
                    connection.query("INSERT INTO user(account, password) values(?, ?)", [user, password]);
                    let newUser = {
                        account: user,
                        password: password,
                    }
                    resolve({
                        status: 'newUser',
                        data: newUser
                    })
                }
            })
    })
}

app.get('/main', function(req, res) {
    if (req.session.loggedIn){
        let mainPage = fs.readFileSync('./private/templates/main.html');
        let mainDom = new JSDOM(mainPage);
        let $main = require('jquery')(mainDom.window);
        $main('#name').html('<p>' + req.session.account + '</p>')
        var userCount = 0;

        io.on('connect', function(socket) {
            userCount++;
            let str = req.session.account;
            socket.userName = str;
            io.emit('user_joined', { user: socket.userName, numOfUsers: userCount });
            console.log('Connected users:', userCount);
        
            socket.on('disconnect', function(data) {
                userCount--;
                io.emit('user_left', { user: socket.userName, numOfUsers: userCount });
        
                console.log('Connected users:', userCount);
            });
        
            socket.on('chatting', function(data) {
        
                console.log('User', data.name, 'Message', data.message);
        
                // if you don't want to send to the sender
                //socket.broadcast.emit({user: data.name, text: data.message});
        
                if(socket.userName == "anonymous") {
        
        
                    io.emit("chatting", {user: data.name, text: data.message,
                        event: socket.userName + " is now known as " + data.name});
                    socket.userName = data.name;
        
                } else {
        
                    io.emit("chatting", {user: socket.userName, text: data.message});
        
                }
        
        
            });
        
        });
        res.send(mainDom.serialize());
    } else {
        res.redirect("/");
    }

    
})

app.get('/logout', function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            console.log(error);
        }
    });
    res.redirect("/main");
})
// RUN SERVER
let PORT = 8000;
server.listen(PORT, function () {
    console.log('Listening on port ' + PORT + '!');
})

