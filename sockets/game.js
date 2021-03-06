"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io, socket) {
    var path = require("path");
    var Room = mongoose.model("Room");
    var Card = mongoose.model("Card");
    var User = mongoose.model("User");

    // Utility functions
    // Game functions
    socket.on("game:", function (msg) {
        console.log("Game: " + msg);
    });
    socket.on("game:connect", function (msg) {
        var decode = validator.isValidToken(msg.token);
        if (decode) {
            socket.username = decode.displayname;
            // User connected
            //socket.emit("chat:receive", {chat:socket.rooms[1], user:"System", text: "You are connected", timestamp:Date()});

            Room.findOne({player2: null}, function (err, roomResult) {
                if (roomResult) {
                    roomResult.player2 = decode.displayname;
                    roomResult.turn = roomResult.player1;
                    socket.join(roomResult.name);
                    roomResult.save();
                    socket.emit("chat:receive", {
                        chat: roomResult.name,
                        user: "System",
                        text: "You are connected to " + roomResult.name + " as player 2",
                        timestamp: Date()
                    });
                } else {
                    var room = new Room({
                        name: "newGame" + Math.floor(new Date() / 1000), // To ensure the temporary name is unique
                        player1: decode.displayname,
                        player2: null,
                        turn: null,
                        board: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    });
                    room.name = "Game" + room._id;
                    socket.join(room.name);
                    room.save();
                    socket.emit("chat:receive", {
                        chat: room.name,
                        user: "System",
                        text: "You are connected to " + room.name + " as player 1",
                        timestamp: Date()
                    });
                }
            });
        } else {
            // warn client they aren"t connected
        }
    });
    socket.on("game:placeCard", function (msg) { //Handle placing the card on the board
        // check position for collision
//              console.log(msg);
        var row = msg.position.charAt(0);      // can have x field in msg object
        var col = msg.position.charAt(1);      // can have y field in msg object
        var loc = row * 3 + col * 3;
        // check room validity
        Room.findOne({name: msg.current}, function (err, roomResult) {
            if (!err && roomResult) {
                if (socket.username !== roomResult.turn) {
                    socket.emit("chat:receive", {
                        chat: msg.current,
                        user: "System",
                        text: "Not your turn",
                        timestamp: Date()
                    });
                    //              socket.emit("change turn");
                } else {
                    if (roomResult.board[loc] === 1) {
                        socket.emit("chat:receive", {
                            chat: msg.current,
                            user: "System",
                            text: "Position taken",
                            timestamp: Date()
                        });
                    } else {
                        // check card validity
                        Card.findOne({title: msg.card}, function (err, cardResult) {
                                if (!err && cardResult) {
                                    io.to(msg.current).emit("game:updateBoard", cardResult.picture, msg.position);
                                    //              io.to(socket.rooms[1]).emit("change turn");
                                    if (roomResult.turn === roomResult.player1) {
                                        roomResult.turn = roomResult.player2;
                                    } else {
                                        roomResult.turn = roomResult.player1;
                                    }
                                    roomResult.board[loc] = 1;
                                    roomResult.markModified("board");
                                    roomResult.save();
                                } else {
                                    // invalid card
                                    socket.emit("chat:recieve", {
                                        text: "no such card",
                                        user: "System",
                                        chat: msg.current
                                    });
                                }
                            }
                        );
                    }
                }
            }
        });
    });
};

