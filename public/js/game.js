"use strict";
var game = {
    current: null,
    eventHandlers: function () {
        // Override clicks
        $("#send-place").click(function (event) {
            event.preventDefault();
            var x = $("#input-x").val();
            var y = $("#input-y").val();
            var card = $("#element").val();
            // check x,y authenticity

            var m = x + "" + y;
//        socket.emit("chat message", m);
            socket.emit("game:placeCard", {card: card, position: m, current: game.current});
//            socket.emit("change turn");
        });
        $("a#gameJoin").click(function (event) {
            event.preventDefault();
            socket.emit("game:connect", {token: user.info.token});
            $("a#gameJoin").parent().addClass("hidden");
        });
        // Socket event capturing
        socket.on("game:updateBoard", function (data, pos) { // Place card on x/y
            var posi = "#pos" + pos;
            var img = "img" + pos;
            console.log(data + " : " + posi);
            $(posi).html("<img src=" + data + ">");
        });

    }
};
$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:", "Test");
});
