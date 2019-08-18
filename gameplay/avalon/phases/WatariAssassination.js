/* Each 
must have:
- Name
- Whether to show guns or not
- GameMove to perform operations
- Buttons that are visible and what text they have
- Number of targets allowed to be selected
- Status message to display
*/
var usernamesIndexes = require("../../../myFunctions/usernamesIndexes");

class LAssassination {
    constructor(thisRoom) {
        this.thisRoom = thisRoom;
        
        // The role that is the owner of this phase
        this.role = "Mikami";
        
        this.phase = "WatariAssassination";
        this.showGuns = true;
        
        this.finishedShot = false;
        
    };
    
    gameMove (socket, buttonPressed, selectedPlayers) {
        if (buttonPressed !== "yes") {
            // this.thisRoom.sendText(this.thisRoom.allSockets, `Button pressed was ${buttonPressed}. Let admin know if you see this.`, "gameplay-text");
            return;
        }

        if (this.finishedShot === false) {
            // Carry out the assassination move
            if (socket && selectedPlayers) {
                
                // Check that the person making this request is the assassin
                var indexOfRequester = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, socket.request.user.username);
                if (this.thisRoom.playersInGame[indexOfRequester].role === this.role) {
                    
                    // Just shoot Watari
                    if (selectedPlayers.length === 1) {
                        if (typeof (selectedPlayers) === "object" || typeof (selectedPlayers) === "array") {
                            selectedPlayers = selectedPlayers[0];
                        }
                        
                        var indexOfTarget = usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, selectedPlayers);
                        // Check the alliance of the target. If they are spy, reject it and ask them to shoot a res.
                        // Note: Allowed to shoot Oberon
                        if (this.thisRoom.playersInGame[indexOfTarget].alliance === "Spy" &&
                        this.thisRoom.playersInGame[indexOfTarget].role !== "Misa") {
                            
                            socket.emit("danger-alert", "You are not allowed to shoot a known spy.");
                            return;
                        }
                        
                        
                        // Get Watari's username
                        var WatariUsername = undefined;
                        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                            if (this.thisRoom.playersInGame[i].role === "Watari") {
                                WatariUsername = this.thisRoom.playersInGame[i].username;
                            }
                        }
                        //set the player shot in the assassin role object
                        this.thisRoom.specialRoles["Mikami"].playerShot2 = selectedPlayers;
                        
                        if (indexOfTarget !== -1) {
                            if (this.thisRoom.playersInGame[indexOfTarget].role !== "Watari") {
                                this.thisRoom.winner = "Detectives";
                                this.thisRoom.howWasWon = "Watari survived assassination.";
                              
                                this.thisRoom.sendText(this.thisRoom.allSockets, "Mikami tried to assassinate " + selectedPlayers + "! " + selectedPlayers + " was not Watari, " + WatariUsername + " was!", "gameplay-text-blue");
                             this.finishedShot = true;
                                
                                //For gameRecord - get the role that was shot
                            for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                                if (this.thisRoom.playersInGame[i].username === selectedPlayers) {
                                    this.thisRoom.whoAssassinShot = this.thisRoom.playersInGame[i].role;
                                    break;
                                }
                            }
                            
                            this.thisRoom.finishGame(this.thisRoom.winner);
                            }
                            else {
                                this.thisRoom.allSockets, "Mikami has assassinated " + WatariUsername + "! They were correct!", "gameplay-text-red");
                                this.thisRoom.phase = "LAssassination"
                                // console.log("THIS WAS RUN ONCE");
                          
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
        var indexOfAssassin = -1;
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === this.role) {
                indexOfAssassin = i;
                break;
            }
        }
        
        var obj = {
            green: {},
            red: {}
        };
        
        if (indexOfPlayer === indexOfAssassin) {
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
            // If assassin, one player to select (assassinate)
            if (this.thisRoom.playersInGame[indexOfPlayer].role === this.role) {
                
                // Check if Merlin exists.
                var merlinExists = false;
                // Check if iso tristan are both in the game.
                var tristExists = false;
                var isoExists = false;
                
                for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
                    if (this.thisRoom.playersInGame[i].role === "Merlin") {
                        merlinExists = true;
                    }
                    
                    if (this.thisRoom.playersInGame[i].role === "Tristan") {
                        tristExists = true;
                    }
                    
                    if (this.thisRoom.playersInGame[i].role === "Isolde") {
                        isoExists = true;
                    }
                }
                
                if (tristExists === true && isoExists === true && merlinExists) {
                    return [1, 2];
                }
                
                else if (tristExists === true && isoExists === true) {
                    return 2;
                }
                
                else if (merlinExists === true) {
                    return 1;
                }
            }
            else {
                return null;
            }
        }
    }
    
    
    getStatusMessage (indexOfPlayer) {
        //Get the index of the assassin
        var indexOfAssassin = -1;
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].role === this.role) {
                indexOfAssassin = i;
            }
        }
        
        if (indexOfPlayer === indexOfAssassin) {
            return "Assassinate Watari."
        }
        // If it is any other player who isn't special role
        else {
            var usernameOfAssassin = this.thisRoom.playersInGame[indexOfAssassin].username;
            return "Waiting for " + usernameOfAssassin + " to assassinate Watari."
        }
    }
    
    getProhibitedIndexesToPick (indexOfPlayer) {
        var spyIndexes = [];
        
        for (var i = 0; i < this.thisRoom.playersInGame.length; i++) {
            if (this.thisRoom.playersInGame[i].alliance === "Kira" && this.thisRoom.playersInGame[i].role !== "Misa") {
                spyIndexes.push(i);
            }
        }
        
        return spyIndexes;
    }
}


module.exports = WatariAssassination;
