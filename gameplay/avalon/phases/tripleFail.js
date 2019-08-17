/* Each phase should have:
- Name
- Whether to show guns or not
- GameMove to perform operations
- Buttons that are visible and what text they have
- Number of targets allowed to be selected
- Status message to display
- Prohibited Indexes to pick (an array)
*/

var usernamesIndexes = require("../../../myFunctions/usernamesIndexes");

class supporterFail {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
         this.role = "Mikami";
        this.phase = "tripleFail";
        this.showGuns = true;
       
    };
    
    gameMove (socket, buttonPressed, selectedPlayers) {
        if (buttonPressed !== "yes") {
            // this.thisRoom.sendText(this.thisRoom.allSockets, `Button pressed was ${buttonPressed}. Let admin know if you see this.`, "gameplay-text");
            return;
        }

        if (socket === undefined || selectedPlayers === undefined) {
            return;
        }
        
        // console.log("typeof Data: ");
        // console.log(typeof(data));
        
        if (typeof (selectedPlayers) === "object" || typeof (selectedPlayers) === "array") {
            selectedPlayers = selectedPlayers[0];
        }
        
        // console.log("Data: ");
        // console.log(data);
        
        //Check that the target's username exists
        var targetUsername = selectedPlayers;
        var found = false;
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].username === targetUsername) {
                found = true;
                break;
            }
        }
        if (found === false) {
            socket.emit("danger-alert", "Error: User does not exist. Tell the admin if you see this.");
            return;
        }
       //Check that the person making this request is Mikami
       var indexOfRequester = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, socket.request.user.username);
                if (this.thisRoom.playersInGame[indexOfRequester].role === this.role);
  {
            // Check if we can card that person
            if (this.thisRoom.lastProposedTeam.includes(selectedPlayers) !== true) {
                socket.emit("danger-alert", "You cannot investigate that person!");
                return;
            }
            
            //grab the target's role
            var role = this.thisRoom.playersInGame[targetIndex].role;
            
            //emit to Mikami the person's person
            socket.emit("mikamiFail-info", /*"Player " + */targetUsername + " is " + role + ".");
            // console.log("Player " + target + " is a " + role);
            
            
            // this.gameplayMessage = (socket.request.user.username + " has carded " + target);
            this.thisRoom.sendText(this.thisRoom.allSockets, ("The Kira supporter has investigated" + targetUsername + "."), "gameplay-text");
            
            
            //update phase
            this.thisRoom.phase = "misakiraFail";
        }
        // The requester is not Mikami. Ignore the request.
        else {
            socket.emit("danger-alert", "You are not the player currently investigating.");
            
            return;
        }
        
    };
    
    buttonSettings (indexOfPlayer) {
     
        
        var obj = {
            green: {},
            red: {}
        };
        
        if (this.thisRoom.playersInGame[indexOfRequester].role === this.role) {
            obj.green.hidden = false;
            obj.green.disabled = true;
            obj.green.setText = "Card";
            
            obj.red.hidden = true;
            obj.red.disabled = true;
            obj.red.setText = "";
        }
        // If it is any other player who isn't special role
        else {
            obj.green.hidden = true;
            obj.green.disabled = true;
            obj.green.setText = "";
            
            obj.red.hidden = true;
            obj.red.disabled = true;
            obj.red.setText = "";
        }
        return obj;
    }
    
    numOfTargets (indexOfPlayer) {
 
        
        if (indexOfRequester !== undefined && indexOfRequester !== null) {
            // If indexOfPlayer is the lady holder, one player to select 
            if (this.thisRoom.playersInGame[indexOfRequester].role === this.role) {
                return 1;
            }
            else {
                return null;
            }
        }
    }
    
    
    getStatusMessage (indexOfPlayer) {
        var indexOfRequester = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, socket.request.user.username);
        
        if (this.thisRoom.playersInGame[indexOfRequester].role === this.role) {
            return "Choose a player to investigate.";
        }
        // If it is any other player who isn't special role
        else {
            return "Waiting for the Kira supporter to investigate someone."
        }
    }
    
    
}



module.exports = tripleFail;
