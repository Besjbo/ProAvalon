class Naomi {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        this.role = "Naomi";
        this.alliance = "Resistance";
        
        this.description = "Knows the identity of L and Light.";
        this.orderPriorityInOptions = 80;
        
        this.test = function () {
            // The following lines running successfully shows that each role file can access
            // the variables and functions from the game room!
            console.log("HII from Percival. I will send messages to players through socket.emit()");
            var data = {
                message: "LOLOL FROM PERCY",
                classStr: "server-text"
            }
            
            this.thisRoom.io.in(this.thisRoom.roomId).emit("roomChatToClient", data);
        }
    }
    // Naomi sees L and Light
    see () {
        var roleTag = {};
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === "L" || this.thisRoom.playersInGame[i].role === "Light Yagami") {
                roleTag[this.thisRoom.playersInGame[i].username] = {};
                roleTag[this.thisRoom.playersInGame[i].username].roleTag = "L?";
            }
        }
        
        return roleTag;
    }
}


module.exports = Naomi;
