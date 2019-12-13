var usernamesIndexes = require("../../../myFunctions/usernamesIndexes");

class Mikami {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        this.specialPhase = "NaomiAssassination";
       this.specialPhase = "WatariAssassination";
        this.specialPhase = "LAssassination";
        this.specialPhase = "MatsudaAssassination";
        
        this.role = "Mikami";
        this.alliance = "Kira";
        
        this.description = "If the detectives capture Light, Mikami can assassinate every detective as their specific role. If he is correct, Kira wins!";
        this.orderPriorityInOptions = 90;
        
        this.playerShot = "";
        this.playerShot2 = "";
        this.playerShot3 = "";
        this.playerShot4 = "";
    }
    //Mikami sees Light but not Misa
    see () {
        if (this.thisRoom.gameStarted === true) {
            var obj = {};
            var array = [];
            
            for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                if (this.thisRoom.playersInGame[i].alliance === "Kira") {
                    
                    if (this.thisRoom.playersInGame[i].role === "Misa") {
                        //don't add Misa
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
    
    //Assassination phase
    checkSpecialMove (socket, buttonPressed, selectedPlayers) {
        //Check for assassination mode and enter it if it is the right time
        if (this.playerShot === "") {
            // If we have the right conditions, we go into assassination phase
            if (this.thisRoom.phase === "finished") {
                //Check that all 4 missions have happened:
                if (this.thisRoom.missionHistory.length === 4 ) {
                    // Set the assassination phase
                    this.thisRoom.startAssassinationTime = new Date();
                    this.thisRoom.phase = this.specialPhase;
                    return true;
                }
            }
        }
        
        return false;
    };
    
    getPublicGameData () {
        if (this.playerShot !== "") {
            return {
                assassinShotUsername: this.playerShot,
                assassinShotUsername2: this.playerShot2
                
            };
        }
        else {
            return null;
        }
    }
}

module.exports = Mikami;
