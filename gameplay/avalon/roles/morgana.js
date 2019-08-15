

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
        if (this.thisRoom.gameStarted === true) {
            var obj = {};
            var array = [];
            
            for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                if (this.thisRoom.playersInGame[i].alliance === "Kira") {
                    
                    if (this.thisRoom.playersInGame[i].role === "Oberon") {
                        //don't add oberon
                    }
                    else {
                        //add the spy
                        array.push(this.thisRoom.playersInGame[i].username);
                    }
                }
            }
            
            obj.spies = array;
            return obj;
        }
    }
    
    checkSpecialMove () {
        
    }
    
}


module.exports = Light;
