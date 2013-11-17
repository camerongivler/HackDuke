var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
var clients = [];
var positions = [];
var names = [];
var width = 10000000;
var height = 10000000;

router.use(express.static(path.resolve(__dirname, 'client')))

io.set('log level', 1);
io.on('connection', function (socket) {
    if(clients.length >=4){
        socket.emit('leave');
        return;
    }
    clients.push(socket);
    positions.push({
        shipX: 0,
        shipY: 0,
        angle: 0
    });
    socket.set('num', clients.indexOf(socket));

    socket.on('name', function (name) {
        socket.set('name', name, function () { 
            socket.get('num', function (err, num) {
                names[num] = name;
                socket.emit('ready', num);
            });
            broadcast('names', names);
        });
    });

    socket.on('size', function (size) {
        height = size.height > height ? height : size.height;
        width = size.width > width ? width : size.width;

        if (width < 900) width = 900;
        if (height < 600) height = 600;

        broadcast('size', {
            width: width,
            height: height
        });
    });

    socket.on('disconnect', function () {
        socket.get('name', function (err, name) {
            broadcast('disconnect', name);
        });
    });

    socket.on('died', function(){
        socket.get('num', function (err, num){
            broadcast('remove', num);
        });
    });

    socket.on('position', function (pos) {
        socket.get('num', function (err, num) {
            positions[num] = pos;
            if (pos.bulletPosX !== -1 && pos.bulletPosY !== -1) {
                for (var k = 0; k < positions.length; k++) {
                    if (k == num) continue;
                    var x = pos.bulletPosX;
                    var y = pos.bulletPosY;
                    if (Math.sqrt(Math.pow((positions[k].shipX - x), 2) + Math.pow((positions[k].shipY - y), 2)) <= 30) {
                        socket.emit('stopBullet');
                        clients[k].emit('hit');
                        positions[num].bulletPosX = -1;
                        positions[num].bulletPosY = -1;
                    }
                }
            }
        });
    });
});

setInterval(function () {
    broadcast('positions', positions);
}, 150);

var broadcast = function (event, data) {
    clients.forEach(function (socket) {
        socket.emit(event, data);
    });
};

server.listen(process.env.PORT || 8000, process.env.IP || "0.0.0.0", function () {
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
