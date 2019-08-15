class Misa {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        this.role = "Misa";
        this.alliance = "Kira";
        
        this.description = "Misa does not see her teammates."
        this.orderPriorityInOptions = 50;
    }
    //Oberon only sees him/herself
    see () {
        if (this.thisRoom.gameStarted === true) {
            var obj = {};
            var array = [];
            
            for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                if (this.thisRoom.playersInGame[i].role === "Misa") {
                    array.push(this.thisRoom.playersInGame[i].username);
                    break;
                }
            }
            
            obj.spies = array;
            return obj;
        }
    }
    
    checkSpecialMove () {
        
    }
    
}


module.exports = Misa;
