/* Each phase must have:
- Name
- Whether to show guns or not
- GameMove to perform operations
- Buttons that are visible and what text they have
- Number of targets allowed to be selected
- Status message to display
*/
var usernamesIndexes = require("../../../myFunctions/usernamesIndexes");

class KiraFail {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        // The role that is the owner of this phase
        this.role = "Light Yagami";
        
        this.phase = "KiraFail";
        this.showGuns = true;
        
    };
    
    gameMove (socket, buttonPressed, selectedPlayers) {
        if (buttonPressed !== "yes") {
            // this.thisRoom.sendText(this.thisRoom.allSockets, `Button pressed was ${buttonPressed}. Let admin know if you see this.`, "gameplay-text");
            return;
        }

        if (this.finishedKiraShot === false) {
            // Carry out the assassination move
            if (socket && selectedPlayers) {
                
                // Check that the person making this request is Light
                var indexOfRequester = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, socket.request.user.username);
                if (this.thisRoom.playersInGame[indexOfRequester].role === this.role) {
                    
                    // Shoot L
                    if (selectedPlayers.length === 1) {
                        if (typeof (selectedPlayers) === "object" || typeof (selectedPlayers) === "array") {
                            selectedPlayers = selectedPlayers[0];
                        }  
                      
                        var indexOfTarget = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, selectedPlayers);              
                        //Check that the target is on the investigation  
                        if (this.thisRoom.lastProposedTeam.includes(selectedPlayers) !== true) {
                socket.emit("danger-alert", "You must assassinate someone on  the investigation!");
                return;
            }
                        //Kira is not allowed to assassinate a supporter
                         if (this.thisRoom.playersInGame[indexOfTarget].alliance === "Kira") {
                            socket.emit("danger-alert", "Do not assassinate your teammate!");
                            return;
                        }
                    
                        // Get L's username
                        var LUsername = undefined;
                        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                            if (this.thisRoom.playersInGame[i].role === "L") {
                                LUsername = this.thisRoom.playersInGame[i].username;
                            }
                        }
                        
                        //if Kira shoots L, end the game, otherwise go to picking team
                        this.thisRoom.specialRoles["Light Yagami"].playerShot = selectedPlayers;
                        
                        if (indexOfTarget !== -1) {
                            if (this.thisRoom.playersInGame[indexOfTarget].role === "L") {
                                this.thisRoom.winner = "Kira";
                                this.thisRoom.howWasWon = "Light assassinated L.";
                                
                                this.thisRoom.sendText(this.thisRoom.allSockets, "Kira has assassinated " + LUsername + "! They were correct!", "gameplay-text-red");
                                
                                this.thisRoom.finishGame(this.thisRoom.winner);
                            }
                            else {
                                // console.log("THIS WAS RUN ONCE");
                                this.thisRoom.sendText(this.thisRoom.allSockets, "Kira has attempted to assassinate " + selectedPlayers + ". " + selectedPlayers + " was not L.", "gameplay-text-blue");
                                this.thisRoom.phase = "pickingTeam";
                            }    
          
                        }
                        else {
                            console.log(selectedPlayers);
                            socket.emit("danger-alert", "Bad assassination data. Tell the admin if you see this!");
                        }
                    }
                        
                    }
                }
            }
        }
    };
    
    // Returns a object with green and red keys. 
    // Green and Red must both have the following properties:
    //  hidden          - Is the button hidden?
    //  disabled        - Is the button disabled?
    //  setText         - What text to display in the button
    buttonSettings (indexOfPlayer) {
        //Get the index of the assassin
        var indexOfKira = -1;
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === this.role) {
                indexOfKira = i;
                break;
            }
        }
        
        var obj = {
            green: {},
            red: {}
        };
        
        if (indexOfPlayer === indexOfKira) {
            obj.green.hidden = false;
            obj.green.disabled = true;
            obj.green.setText = "Shoot";
            
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
        if (indexOfPlayer !== undefined && indexOfPlayer !== null) {
            // If L, one player to select (assassinate)
            if (this.thisRoom.playersInGame[indexOfPlayer].role === this.role) {
                
                // Check if L exists.
                var LExists = false;
                
                for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                    if (this.thisRoom.playersInGame[i].role === "L") {
                        LExists = true;
                    }
                
          
               if (LExists === true) {
                    return 1;
                }
            }
            else {
                return null;
            }
        }
    }
    
    
    getStatusMessage (indexOfPlayer) {
        //Get the index of Kira
        var indexOfKira = -1;
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === this.role) {
                indexOfKira = i;
            }
        }
        
        if (indexOfPlayer === indexOfKira) {
            return "Assassinate L."
        }
        // If it is any other player who isn't special role
        else {
            var usernameOfAssassin = this.thisRoom.playersInGame[indexOfAssassin].username;
            return "Waiting for Kira to assassinate."
        }
    }
    
    getProhibitedIndexesToPick (indexOfPlayer) {
        var spyIndexes = [];
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].alliance === "Kira") {
                spyIndexes.push(i);
            }
        }
        
        return spyIndexes;
    }
}


module.exports = Assassination;
    
        
