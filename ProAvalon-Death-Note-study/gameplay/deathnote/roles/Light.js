

class Light {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        this.role = "Light Yagami";
        this.alliance = "Kira";
        
        this.description = "The Kira leader, who has the power to kill L.";
        this.orderPriorityInOptions = 70;
    }
    //Light sees all Kiras
        see () {
        var roleTag = {};
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === "Misa") {
                roleTag[this.thisRoom.playersInGame[i].username] = {};
                roleTag[this.thisRoom.playersInGame[i].username].roleTag = "Misa";
            }
        }
        
        return roleTag;
    }
        see () {
        var roleTag = {};
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === "Mikami") {
                roleTag[this.thisRoom.playersInGame[i].username] = {};
                roleTag[this.thisRoom.playersInGame[i].username].roleTag = "Mikami";
            }
        }
        
        return roleTag;
    }

    see () {
        if (this.thisRoom.gameStarted === true) {
            var obj = {};
            var array = [];
            
            for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                if (this.thisRoom.playersInGame[i].alliance === "Kira") {
                        array.push(this.thisRoom.playersInGame[i].username);
                    }
                }
            }
            
            obj.spies = array;
            return obj;
        }
    }
}

    checkSpecialMove () {
        
    }

module.exports = Light;
