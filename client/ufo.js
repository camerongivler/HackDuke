    var strength = 0;
    var maxHealth;
    var currHealth = 10;
    var velocity = 10;
    var angle = 0;
    var bulletAngle;
    var aVel = 9;
    var height = $(window).height() - 25;
    var width = $(window).width() - 25;
    var shipX = Math.floor(Math.random() * width); // Change to reflect ship size
    var shipY = Math.floor(Math.random() * height); // Change to reflect ship size
    var bulletPosX;
    var bulletPosY;
    var bulletVel = 50;
    var playerName = prompt("What is your username?");
    var interval;
    var bulletFlag = false;
    var ships = [];
    var myNum;
    var myShip;
    var keys = [];
    var myBullet;
    var socket;
    var events;

    $(function () {
        //socket connection
        socket = io.connect();

        socket.on('connect', function () {
            socket.emit('size', {
                height: height,
                width: width
            });
            socket.emit('name', playerName);
        });

        socket.on('size', function (size) {
            height = size.height;
            width = size.width;
            $('#view').height(height);
            $('#view').width(width);
        });

        socket.on('ready', function (num) {
            myNum = num;
            init();
        });

        socket.on('names', function (names) { 
            for (var k = ships.length; k<names.length; k++) {
                if (k== myNum) continue;
                $('#view').append('<div class="ship" id = "' + k + '">' + names[k] + '</div>');
            }
            ships = names;
            $('#0').css({
                'background-color':'blue'
            });
            $('#1').css({
                'background-color':'green'
            });
            $('#2').css({
                'background-color':'orange'
            });
            $('#3').css({
                'background-color':'red'
            });
        });

        socket.on('positions', function (pos) {
            updatePositions(pos);
        });
        
        socket.on('leave', function(){
            clearInterval(events);
            myShip = null;
            myBullet = null;
            playerName = null;
            velocity = null;
            socket = null;
            events = null;
        });
        
        socket.on('stopBullet', function () {
            clearInterval(interval);
            myBullet.hide();
            bulletPosX = -1;
            bulletPosY = -1;
            bulletFlag = false;
        });
        
        socket.on('hit', wasAttacked);
        
        socket.on('remove', function (number) {
            isRemoved(number);
        });

        setInterval(function () {
            socket.emit('position', {
                shipY: shipY,
                shipX: shipX,
                angle: angle,
                bulletPosX: bulletPosX,
                bulletPosY: bulletPosY
            });
        }, 50);

        $(window).resize(function () {
            if($(window).height() - 25 > height && $(window).width - 25 > width)
                return;
            height = $(window).height() - 25;
            width = $(window).width() - 25;
            socket.emit('size', {height: height, width: width});
        });
    });

    // Initialization
    var init = function () {
        $('#view').append('<div class="ship" id="' + myNum + '"></div>');
        for(var k = 0; k < 4; k++){
            $('#view').append('<div class="bullet" id="b' + k + '"></div>');
            $('#b' + k).hide();
        }
        myShip = $('#' + myNum);
        myBullet = $('#b' + myNum);
        myShip.text(playerName);
        draw(myShip, shipX, shipY, angle);
        events = setInterval(eventLoop, 50);

        $(window).keydown(function (event) {
            keys[event.which] = true;
        }).keyup(function (event) {
            delete keys[event.which];
        });
        draw(myShip, shipX, shipY, angle);
    };


    // Movement
    var draw = function (ship, x, y, ang) {
        ship.css({
            top: y,
            left: x
        });
        ship.css({
            transform: 'rotate(' + ang + 'deg)'
        });
    };

    var drawBullet = function () {
        if (!bulletFlag) {
            myBullet.show();
            bulletFlag = true;
            bulletAngle = angle;
            bulletPosY = Math.round(shipY - 30 * Math.cos((bulletAngle / 360) * 2 * Math.PI) - 5);
            bulletPosX = Math.round(shipX + 30 * Math.sin((bulletAngle / 360) * 2 * Math.PI) - 5);
            myBullet.css({
                top: bulletPosY,
                left: bulletPosX
            });
            interval = setInterval(updateBullet, 50);
        }
    };

    var updateBullet = function () {

        bulletPosX += Math.round(bulletVel * Math.sin((bulletAngle / 360) * 2 * Math.PI));
        bulletPosY -= Math.round(bulletVel * Math.cos((bulletAngle / 360) * 2 * Math.PI));

        myBullet.css({
            top: bulletPosY,
            left: bulletPosX
        });
        if (bulletPosY < 0 || bulletPosY > height || bulletPosX < 0 || bulletPosX > width) {
            clearInterval(interval);
            myBullet.hide();
            bulletPosX = -1;
            bulletPosY = -1;
            bulletFlag = false;
        }
    };
    
    var enemyBullet = function(bullet, posX, posY){
        if(posX == -1 || posY == -1)
            bullet.hide();
        else{
            bullet.show();
            bullet.css({left: posX, top: posY});
        }
    };

    var updatePositions = function (pos) {
        for (var k = 0; k < pos.length; k++) {
            if (k == myNum) continue;
            draw($('#' + k), pos[k].shipX, pos[k].shipY, pos[k].angle);
            enemyBullet($('#b' + k), pos[k].bulletPosX, pos[k].bulletPosY);
        }
    };

    var eventLoop = function () {
        if (keys[37]) {
            angle -= aVel;
            if (angle < 0) angle += 360;
        }
        if (keys[38]) {
            shipY -= Math.round(Math.cos((angle / 360) * 2 * Math.PI) * velocity);
            shipX += Math.round(Math.sin((angle / 360) * 2 * Math.PI) * velocity);

        }
        if (keys[39]) {
            angle += aVel;
            if (angle >= 360) angle -= 360;
        }
        if (keys[40]) {
            shipY += Math.round(Math.cos((angle / 360) * 2 * Math.PI) * velocity);
            shipX -= Math.round(Math.sin((angle / 360) * 2 * Math.PI) * velocity);
        }
        if (keys[32]) {
            drawBullet();
        }
        if (shipX > width - 35) shipX = width - 35;
        if (shipX < 35) shipX = 35;
        if (shipY > height - 35) shipY = height - 35;
        if (shipY < 35) shipY = 35;
        draw(myShip, shipX, shipY, angle);
    };
    
    var wasAttacked = function()
    {
        currHealth -= 1 - strength;
        if(currHealth < 4)
            $('#health').css('background-color', 'red');
        $('#health').css({width: currHealth*10 + "px"});
        if(currHealth <= 0)
        {
            socket.emit('died');
            myShip.remove();
            myBullet.remove();
            clearInterval(interval);
            bulletPosX = -1;
            bulletPosY = -1;
            bulletFlag = true;
            clearInterval(events);
        }
    }
    
    var isRemoved = function(number)
    {
        $('#' + number).remove();
        $('#b' + number).remove();
    }