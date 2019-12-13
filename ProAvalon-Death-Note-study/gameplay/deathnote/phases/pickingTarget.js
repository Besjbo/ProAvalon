var usernamesIndexes = require("../../myFunctions/usernamesIndexes");

function PickingTarget(thisRoom_) {
    this.thisRoom = thisRoom_;

    this.phase = "pickingTarget";
    this.showGuns = true;
};


PickingTarget.prototype.gameMove = function (socket, buttonPressed, selectedPlayers) {
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
    // If the person requesting is the host
    if (usernamesIndexes.getIndexFromUsername(this.thisRoom.playersInGame, socket.request.user.username) === this.thisRoom.teamLeader) {



        //Check that the data is valid (i.e. includes only usernames of players)
        for (var i = 0; i < 2; i++) {
            // If the data doesn't have the right number of users
            // Or has an empty element
            if (!selectedPlayers[i]) {
                return;
            }
            if (this.thisRoom.playerUsernamesInGame.includes(selectedPlayers[i]) === false) {
                return;
            }
        }

        //Continue if it passes the above check
        this.thisRoom.proposedTarget = selectedPlayers;
        //.slice to clone the array
        this.thisRoom.playersYetToVote = this.thisRoom.playerUsernamesInGame.slice();

        //--------------------------------------
        //Send out the gameplay text
        //--------------------------------------
       

        var str2 = socket.request.user.username + " has proposed an investigation of: " + targetUsername + ".";

        this.thisRoom.sendText(this.thisRoom.allSockets, str2, "gameplay-text");

        this.thisRoom.VHUpdateTeamPick();

        this.thisRoom.phase = "votingTeam";
    }
    else {
        console.log("User " + socket.request.user.username + " is not the team leader. Cannot pick.");
    }
};


// Returns a object with green and red keys. 
// Green and Red must both have the following properties:
//  hidden          - Is the button hidden?
//  disabled        - Is the button disabled?
//  setText         - What text to display in the button
PickingTarget.prototype.buttonSettings = function (indexOfPlayer) {

    var obj = {
        green: {},
        red: {}
    };

    // If it is the host
    if (indexOfPlayer === this.thisRoom.teamLeader) {
        obj.green.hidden = false;
        obj.green.disabled = true;
        obj.green.setText = "Pick";

        obj.red.hidden = true;
        obj.red.disabled = true;
        obj.red.setText = "";
    }
    // If it is any other player who isn't host
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


PickingTarget.prototype.numOfTargets = function (indexOfPlayer) {

    if (indexOfPlayer!== undefined && indexOfPlayer === this.thisRoom.teamLeader) {
            // If indexOfPlayer is the Leader, one player to select 
                return 1;
            }
            else {
                return null;
            }
        }


PickingTeam.prototype.getStatusMessage = function (indexOfPlayer) {
    if (indexOfPlayer !== undefined && indexOfPlayer === this.thisRoom.teamLeader) {
        var num = this.thisRoom.numPlayersOnMission[this.thisRoom.playersInGame.length - this.thisRoom.minPlayers][this.thisRoom.missionNum - 1];

        return "Pick a target to investigate.";
    }
    else {
        // console.log(this.thisRoom.teamLeader);
        if (this.thisRoom.playersInGame[this.thisRoom.teamLeader]) {
            return "Waiting for " + this.thisRoom.playersInGame[this.thisRoom.teamLeader].username + " to pick an investigation target.";
        }
        else {
            return "ERROR: Tell the admin if you see this, code 10.";
        }
    }
}



module.exports = PickingTarget;
