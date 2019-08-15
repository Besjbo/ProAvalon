class Watari {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        this.role = "Watari";
        this.alliance = "Detective";
        
        this.description = "Watari sees L.";
        this.orderPriorityInOptions = 50;
    }
    
    see () {
        var roleTag = {};
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === "L") {
                roleTag[this.thisRoom.playersInGame[i].username] = {};
                roleTag[this.thisRoom.playersInGame[i].username].roleTag = "L";
            }
        }
        
        return roleTag;
    }
};


module.exports = Watari;
