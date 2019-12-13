//This file helps us load in the roles from the folder

function index() {
    //Import all the roles from AVALON
    this.getPhases = function (thisRoom) {
        var normalizedPath = require("path").join(__dirname, "./DNcommonPhases");

        var DNcommonPhases = {};
        var obj = {};

        require("fs").readdirSync(normalizedPath).forEach(function (file) {
            // console.log(file);

            // If it is a javascript file, add it
            if (file.includes(".js") === true) {
                name = file.replace(".js", "");

                DNcommonPhases[name] = require("./DNcommonPhases/" + file);
            }
        });


        for (var name in DNcommonPhases) {
            if (DNcommonPhases.hasOwnProperty(name)) {
                //Initialise it
                obj[name] = new DNcommonPhases[name](thisRoom);
            }
        }

        return obj;
    }
}

module.exports = index;
