var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var myNotification = require("../models/notification");
var flash = require("connect-flash");
var sanitizeHtml = require('sanitize-html');
var mongoose = require("mongoose");
var fs = require('fs');


var modAction = require("../models/modAction");
var gameRecord = require("../models/gameRecord");
var statsCumulative = require("../models/statsCumulative");
var banIp = require("../models/banIp");


var middleware = require("../middleware");
const request = require('request');

var modsArray = require("../modsadmins/mods");
var adminsArray = require("../modsadmins/admins");

// Prevent too many requests
const rateLimit = require("express-rate-limit");
// app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)



// exclude pronub from new mods array
var newModsArray = modsArray.filter(mod => mod != "pronub");
//Community route
router.get("/community", function (req, res) {
    // Get all players with more than 50 games excluding mods
    User.find({
        "totalGamesPlayed": { $gt: 99 },
        "usernameLower": { $nin: newModsArray },
        "hideStats": null
    }, function (err, allUsers) {
        if (err) {
            console.log(err);
        }
        else {
            // Get mods excluding pronub
            User.find({
                "usernameLower": { $in: newModsArray }
            },
                function (err, allMods) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.render("community", { users: allUsers, mods: allMods, currentUser: req.user, headerActive: "community" });
                    }
                });
        }
        // sort by games played
    }).sort({ totalGamesPlayed: -1 });
});

//Index route
router.get("/", function (req, res) {
    res.render("index");
});

//register route
router.get("/register", function (req, res) {
    res.render("register", { platform: process.env.MY_PLATFORM });
});


//sitedown route
router.get("/sitedown", function (req, res) {
    res.render("sitedown");
});


const registerLimiter = process.env.MY_PLATFORM === "local" ?
    rateLimit({
        max: 0 // Disable if we are local
    })
    :
    rateLimit({
        windowMs: 60 * 60 * 1000, // 60 minutes
        max: 3
    });

//Post of the register route
router.post("/", registerLimiter, checkIpBan, checkCurrentBan, sanitiseUsername, function (req, res) {
    // console.log("escaped: " + escapeText(req.body.username));

    // res.redirect("sitedown");
    // return;

    // var escapedUsername = escapeText(req.body.username);

    //if we are local, we can skip the captcha
    if (process.env.MY_PLATFORM === "local" || process.env.MY_PLATFORM === "staging") {
        //duplicate code as below
        var newUser = new User({
            username: req.body.username,
            usernameLower: req.body.username.toLowerCase(),
            dateJoined: new Date()
        });

        //set default values
        for (var key in defaultValuesForUser) {
            if (defaultValuesForUser.hasOwnProperty(key)) {
                newUser[key] = defaultValuesForUser[key];
            }
        }

        if (req.body.username.indexOf(" ") !== -1) {
            req.flash("error", "Sign up failed. Please do not use spaces in your username.");
            res.redirect("register");
            return;
        }
        else if (req.body.username.length > 25) {
            req.flash("error", "Sign up failed. Please do not use more than 25 characters in your username.");
            res.redirect("register");
            return;
        }

        else if (usernameContainsBadCharacter(req.body.username) == true) {
            req.flash("error", "Please do not use an illegal character");
            res.redirect("register");
            return;
        }

        else {
            User.register(newUser, req.body.password, function (err, user) {
                if (err) {
                    console.log("ERROR: " + err);
                    req.flash("error", "Sign up failed. Most likely that username is taken.");
                    res.redirect("register");
                } else {
                    //successful, get them to log in again
                    // req.flash("success", "Sign up successful. Please log in.");
                    // res.redirect("/");

                    passport.authenticate("local")(req, res, function () {
                        res.redirect("/lobby");
                    });

                }
            });
        }
    }



    //we are online, require the captcha
    else {
        req.body.captcha = req.body['g-recaptcha-response'];


        if (
            req.body.captcha === undefined ||
            req.body.captcha === '' ||
            req.body.captcha === null
        ) {
            req.flash("error", "The captcha failed or was not inputted.");
            res.redirect("register");
            return;
        }

        const secretKey = process.env.MY_SECRET_GOOGLE_CAPTCHA_KEY;

        const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

        request(verifyUrl, (err, response, body) => {
            body = JSON.parse(body);
            // console.log(body);

            // If Not Successful
            if (body.success !== undefined && !body.success) {
                req.flash("error", "Failed captcha verification.");
                res.redirect("register");
                return;
            }

            var newUser = new User({
                username: req.body.username,
                usernameLower: req.body.username.toLowerCase(),
                dateJoined: new Date()
            });

            //set default values
            for (var key in defaultValuesForUser) {
                if (defaultValuesForUser.hasOwnProperty(key)) {
                    newUser[key] = defaultValuesForUser[key];
                }
            }

            if (req.body.username.indexOf(" ") !== -1) {
                req.flash("error", "Sign up failed. Please do not use spaces in your username.");
                res.redirect("register");
                return;
            }
            else if (req.body.username.length > 25) {
                req.flash("error", "Sign up failed. Please do not use more than 25 characters in your username.");
                res.redirect("register");
                return;
            }

            else if (usernameContainsBadCharacter(req.body.username) == true) {
                req.flash("error", "Please do not use an illegal character");
                res.redirect("register");
                return;
            }

            else {
                User.register(newUser, req.body.password, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err);
                        req.flash("error", "Sign up failed. Most likely that username is taken.");
                        res.redirect("register");
                    } else {
                        //successful, get them to log in again
                        // req.flash("success", "Sign up successful. Please log in.");
                        // res.redirect("/");
                        passport.authenticate("local")(req, res, function () {
                            res.redirect("/lobby");
                        });
                    }
                });
            }
        });

    }
});


const loginLimiter = process.env.MY_PLATFORM === "local" ?
    rateLimit({
        max: 0 // Disable if we are local
    })
    :
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5
    });

//login route
router.post("/login", loginLimiter, sanitiseUsername, passport.authenticate("local", {
    successRedirect: "/lobby",
    failureRedirect: "/loginFail"
}));

router.get("/loginFail", function (req, res) {
    req.flash("error", "Log in failed! Please try again.");
    res.redirect("/");
});




//lobby route
router.get("/lobby", middleware.isLoggedIn, checkIpBan, checkCurrentBan, async function (req, res) {

    // console.log(res.app.locals.originalUsername);
    User.findOne({ username: req.user.username }).populate("notifications").exec(async function (err, foundUser) {
        if (err) {
            // res.render("lobby", {currentUser: req.user, headerActive: "lobby", userNotifications: [{text: "There was a problem loading your notifications.", optionsCog: true}] });
            console.log(err);
            req.flash("error", "Something has gone wrong! Please contact a moderator or admin.");
            res.redirect("/");
        }
        else {

            isMod = false;
            if (req.isAuthenticated() && modsArray.indexOf(req.user.username.toLowerCase()) !== -1) {
                isMod = true;
            }

            res.render("lobby", {
                currentUser: req.user,
                headerActive: "lobby",
                userNotifications: foundUser.notifications,
                optionsCog: true,
                isMod: isMod
            });

            //check that they have all the default values.
            for (var keys in defaultValuesForUser) {
                if (defaultValuesForUser.hasOwnProperty(keys)) {
                    //if they don't have a default value, then give them a default value.
                    if (!foundUser[keys]) {
                        foundUser[keys] = defaultValuesForUser[keys];
                    }
                }
            }
            foundUser.save();

        }

    });
});






//logout 
router.get("/logout", function (req, res) {
    //doesn't work since we destroy the session right after...
    // req.flash("success", "Logged you out!");
    req.session.destroy(function (err) {
        res.redirect('/'); //Inside a callback… bulletproof!
    });
});

router.get("/log", function (req, res) {
    res.render("log", { currentUser: req.user, headerActive: "log", path: "log" });
})

router.get("/rules", function (req, res) {
    res.render("rules", { currentUser: req.user, headerActive: "rules" });
})

router.get("/testmodal", function (req, res) {
    res.render("testmodal", { currentUser: req.user });
});
router.get("/testmodal2", function (req, res) {
    res.render("testmodal2", { currentUser: req.user });
});

router.get("/testAutoCompleteUsernames", function (req, res) {
    res.render("testAutoCompleteUsernames", { currentUser: req.user });
});

router.get("/about", function (req, res) {
    res.render("about", { currentUser: req.user, headerActive: "about" });
});

router.get("/security", function (req, res) {
    res.render("security", { currentUser: req.user });
});

router.get("/troubleshooting", function (req, res) {
    res.render("troubleshooting", { currentUser: req.user });
});

router.get("/statistics", function (req, res) {
    res.render("statistics", { currentUser: req.user, headerActive: "stats" });
});




//Get the moderation logs to show

// 1) Bans
// 2) Mutes
// 3) Forum removes
// 4) Comment and reply removes
// 5) Avatar request approve/rejects

router.get("/mod/ajax/logData/:pageIndex", function (req, res) {
    //get all the mod actions
    var pageIndex;
    if (req.params.pageIndex) {
        pageIndex = req.params.pageIndex;
        if (pageIndex < 0) {
            pageIndex = 0;
        }

        var logs = [];

        var NUM_OF_RESULTS_PER_PAGE = 10;
        // Page 0 is the first page.
        var skipNumber = pageIndex * NUM_OF_RESULTS_PER_PAGE;

        modAction.find({})
            .sort({ whenMade: 'descending' })
            .skip(skipNumber)
            .limit(NUM_OF_RESULTS_PER_PAGE)
            .exec(async function (err, foundModActions) {
                if (err) { console.log(err); }

                else {
                    logsObj = [];
                    await foundModActions.forEach(function (action) {
                        stringsArray = [];
                        switch (action.type) {
                            case "ban":
                                stringsArray[0] = (action.modWhoBanned.username + " has banned " + action.bannedPlayer.username);
                                stringsArray[0] += " for reason: " + action.reason + ".";


                                stringsArray.push("The ban was made on " + action.whenMade);
                                stringsArray.push("The ban will be released on: " + action.whenRelease);
                                stringsArray.push("Moderator message: " + action.descriptionByMod);
                                break;
                            case "mute":
                                stringsArray[0] = (action.modWhoBanned.username + " has muted " + action.bannedPlayer.username);
                                stringsArray[0] += " for reason: " + action.reason + ".";


                                stringsArray.push("The mute was made on " + action.whenMade);
                                // -1970 years because thats the start of computer time
                                stringsArray.push("The mute will be released on: " + action.whenRelease);
                                stringsArray.push("Moderator message: " + action.descriptionByMod);
                                break;
                            // Forum remove
                            case "remove":
                                stringsArray[0] = action.modWhoBanned.username + " removed " + action.bannedPlayer.username + "'s " + action.elementDeleted + ".";
                                stringsArray[0] += " Reason: " + action.reason + ".";

                                stringsArray[1] = "The removal occured on " + action.whenMade;
                                stringsArray[2] = "Moderator message: " + action.descriptionByMod;

                                //Get the extra link bit (The # bit to select to a specific comment/reply)
                                linkStr = "";
                                if (action.elementDeleted === "forum") {
                                    //Dont need the extra bit here
                                }
                                else if (action.elementDeleted == "comment") {
                                    linkStr == "#" + action.idOfComment;
                                }
                                else if (action.elementDeleted == "reply") {
                                    linkStr == "#" + action.idOfReply;
                                }

                                stringsArray[3] = "The link to the article is: <a href='/forum/show/" + action.idOfForum + linkStr + "'>Here</a>";
                                break;
                        }

                        var log = {};
                        log.stringsArray = stringsArray;
                        log.date = action.whenMade;

                        logsObj.push(log);
                    });

                    var obj = {};
                    obj.logs = logsObj;

                    //sort in newest to oldest
                    // obj.logs.sort(compareLogObjs);

                    res.status(200).send(obj);
                }
            });
    }
});


router.get("/mod", middleware.isMod, function (req, res) {
    res.render("mod/mod", { currentUser: req.user, isMod: true, headerActive: "mod" });
});


function gameDateCompare(a, b) {
    if (a.date < b.date) {
        return -1;
    }
    if (a.date > b.date) {
        return 1;
    }
    else {
        return 0;
    }
}



router.get("/ajax/getStatistics", function (req, res) {

    statsCumulative.findOne({}).exec(function (err, record) {
        if (err) {
            console.log(err);
            res.status(200).send("Something went wrong");
        }
        else {
            //    console.log(record);
            if (record === undefined || record === null) {
                res.status(200).send("Something went wrong");
            }
            else {
                // console.log(record);
                res.status(200).send(JSON.parse(record.data));
            }
        }
    });
});

var anonymizeArray = function (array, idmap) {
    if (!array) {
        return array;
    }
    var anonArray = [];
    for (var i = 0; i < array.length; i++) {
        anonArray.push(idmap[array[i]]);
    }
    return anonArray;
}

var anonymizeMapKeys = function (map, idmap) {
    if (!map) {
        return map;
    }
    var anonMap = JSON.parse(JSON.stringify(map));
    for (var key in map) {
        if (!map.hasOwnProperty(key)) {
            continue;
        }
        if (key !== idmap[key]) {
            Object.defineProperty(anonMap, idmap[key], Object.getOwnPropertyDescriptor(anonMap, key));
            delete anonMap[key];
        }
    }
    return anonMap;
}

var anonymizeStats = function (records) {
    var anonymizedRecords = [];
    for (var key in records) {
        var record = records[key];
        var anonymizedRecord = JSON.parse(JSON.stringify(record));
        var usernamesMap = {};
        var usernamesPossible = 'abcdefghijklmnopqrstuvwxyz', idx = 0;
        for (var key in record.playerRoles) {
            if (record.playerRoles.hasOwnProperty(key)) {
                usernamesMap[key] = usernamesPossible[idx++];
            }
        }
        anonymizedRecord.spyTeam = anonymizeArray(record.spyTeam, usernamesMap);
        anonymizedRecord.resistanceTeam = anonymizeArray(record.resistanceTeam, usernamesMap);
        anonymizedRecord.ladyHistoryUsernames = anonymizeArray(record.ladyHistoryUsernames, usernamesMap);
        anonymizedRecord.refHistoryUsernames = anonymizeArray(record.refHistoryUsernames, usernamesMap);
        anonymizedRecord.sireHistoryUsernames = anonymizeArray(record.sireHistoryUsernames, usernamesMap);
        anonymizedRecord.voteHistory = anonymizeMapKeys(record.voteHistory, usernamesMap);
        anonymizedRecord.playerRoles = anonymizeMapKeys(record.playerRoles, usernamesMap);
        anonymizedRecords.push(anonymizedRecord);
    }
    return anonymizedRecords;
}

// Read in the game records
// var fs = require('fs');
// var gameRecordsData = JSON.parse(fs.readFileSync('assets/gameRecordsData/gameRecordsDataSample2.json', 'utf8'));

// // Anonymize it using gameRecordsData
// var gameRecordsDataAnon = anonymizeStats(gameRecordsData); 

// fs.writeFileSync('assets/gameRecordsData/gameRecordsDataAnon.json', JSON.stringify(gameRecordsDataAnon));


router.get("/gameRecordsData", function (req, res) {
    res.download("assets/gameRecordsData/gameRecordsDataAnon.json");
});


var hardUpdateStatsFunction = function () {
    console.log("Starting hard update stats...");
    gameRecord.find({}).exec(function (err, records) {
        if (err) {
            console.log(err);
        }
        else {
            var prevRecordsLength = records.length;
            console.log(records.length + " games loaded.");
            fs.writeFileSync('assets/gameRecordsData/gameRecordsData.json', JSON.stringify(records));
            // Anonymize it using gameRecordsData

            // Filter out the bot games
            records = records.filter(function (r) { return (r.gameMode === undefined || r.gameMode.toLowerCase().includes("bot") == false) });
            console.log("Removed " + (prevRecordsLength - records.length) + " bot games from dataset.");

            var gameRecordsDataAnon = anonymizeStats(records);

            fs.writeFileSync('assets/gameRecordsData/gameRecordsDataAnon.json', JSON.stringify(gameRecordsDataAnon));


            var obj = {};
            obj.totalgamesplayed = records.length;

            //***********************************
            //Site traffic stats - one data point per day
            //***********************************
            var gamesPlayedData = {};
            var xAxisVars = [];
            var yAxisVars = [];
            for (var i = 0; i < records.length; i++) {
                var timeFinish = records[i].timeGameFinished;
                // Round to nearest day
                var dayFinished = new Date(timeFinish.getFullYear(), timeFinish.getMonth(), timeFinish.getDate());

                // Count the number of games played on the same day
                if (gamesPlayedData[dayFinished.getTime()] === undefined) {
                    gamesPlayedData[dayFinished.getTime()] = 1;
                }
                else {
                    gamesPlayedData[dayFinished.getTime()] = gamesPlayedData[dayFinished.getTime()] + 1;
                }
            }

            var gamesPlayedDataArray = [];
            // Turn it into an array of objects
            for (var key in gamesPlayedData) {
                if (gamesPlayedData.hasOwnProperty(key)) {

                    var newObj = {
                        date: key,
                        value: gamesPlayedData[key]
                    }

                    gamesPlayedDataArray.push(newObj);
                }
            }

            // Sort it
            gamesPlayedDataArray.sort(gameDateCompare);

            // Split it into the two axis
            for (var i = 0; i < gamesPlayedDataArray.length; i++) {
                xAxisVars.push(gamesPlayedDataArray[i].date);
                yAxisVars.push(gamesPlayedDataArray[i].value);
                // yAxisVars.push(new Date(gamesPlayedDataArray[i].value)); // This line seems to make server hang..?
            }

            // Remove the last entry since the day isn't over yet...
            xAxisVars.pop();
            yAxisVars.pop();

            obj.siteTrafficGamesPlayedXAxis = xAxisVars;
            obj.siteTrafficGamesPlayedYAxis = yAxisVars;


            //**********************************************
            //Getting the average duration of each game
            //**********************************************
            var averageGameDuration = new Date(0);
            for (var i = 0; i < records.length; i++) {
                var duration = new Date(records[i].timeGameFinished.getTime() - records[i].timeGameStarted.getTime());
                averageGameDuration = new Date(averageGameDuration.getTime() + duration.getTime());
            }
            obj.averageGameDuration = new Date(averageGameDuration.getTime() / records.length);


            //**********************************************
            //Getting the win rate of alliances globally
            //**********************************************
            var resWins = 0;
            var spyWins = 0;
            for (var i = 0; i < records.length; i++) {
                if (records[i].winningTeam === "Resistance") {
                    resWins++;
                    // console.log("res win: ");
                    // console.log(resWins);
                }
                else if (records[i].winningTeam === "Spy") {
                    spyWins++;
                    // console.log("spy win: ");
                    // console.log(spyWins);
                }
                // console.log("winning team:");
                // console.log(records[i].winningTeam);

            }
            obj.totalResWins = resWins;
            obj.totalSpyWins = spyWins;



            //**********************************************
            //Getting the assassination win rate
            //**********************************************
            var rolesShotObj = {};
            for (var i = 0; i < records.length; i++) {
                var roleShot = records[i].whoAssassinShot;
                if (roleShot) {
                    // console.log("a");
                    if (rolesShotObj[roleShot] !== undefined) {
                        rolesShotObj[roleShot] = rolesShotObj[roleShot] + 1;
                        // console.log(roleShot + " was shot, total count: " + rolesShotObj[roleShot]);

                    }
                    else {
                        rolesShotObj[roleShot] = 0;
                    }
                }
            }

            obj.assassinRolesShot = rolesShotObj;


            //**********************************************
            //Getting the average duration of each assassination
            //**********************************************
            var averageAssassinationDuration = new Date(0);
            var count = 0;
            for (var i = 0; i < records.length; i++) {
                if (records[i].timeAssassinationStarted) {
                    var duration = new Date(records[i].timeGameFinished.getTime() - records[i].timeAssassinationStarted.getTime());
                    averageAssassinationDuration = new Date(averageAssassinationDuration.getTime() + duration.getTime());
                    count++;
                }
            }
            obj.averageAssassinationDuration = new Date(averageAssassinationDuration.getTime() / count);

            //**********************************************
            //Getting the win rate for each game size
            //**********************************************
            var gameSizeWins = {};

            for (var i = 0; i < records.length; i++) {
                if (!gameSizeWins[records[i].numberOfPlayers]) {
                    gameSizeWins[records[i].numberOfPlayers] = {};
                    gameSizeWins[records[i].numberOfPlayers].spy = 0;
                    gameSizeWins[records[i].numberOfPlayers].res = 0;
                }

                if (records[i].winningTeam === "Spy") {
                    gameSizeWins[records[i].numberOfPlayers].spy++;
                }
                else if (records[i].winningTeam === "Resistance") {
                    gameSizeWins[records[i].numberOfPlayers].res++;
                }
                else {
                    console.log("error, winning team not recognised: " + records[i].winningTeam);
                }

            }
            obj.gameSizeWins = gameSizeWins;


            //**********************************************
            //Getting the spy wins breakdown
            //**********************************************
            var spyWinBreakdown = {};

            for (var i = 0; i < records.length; i++) {
                if (records[i].winningTeam === "Spy") {
                    if (!spyWinBreakdown[records[i].howTheGameWasWon]) {
                        spyWinBreakdown[records[i].howTheGameWasWon] = 0;
                    }

                    spyWinBreakdown[records[i].howTheGameWasWon]++;
                }
            }
            obj.spyWinBreakdown = spyWinBreakdown;


            //**********************************************
            //Getting the Lady of the lake wins breakdown
            //**********************************************
            var ladyBreakdown = {
                "resStart": {
                    "resWin": 0,
                    "spyWin": 0
                },
                "spyStart": {
                    "resWin": 0,
                    "spyWin": 0
                }
            };



            //IMPORTANT, MUST KEEP THESE ROLES UP TO DATE!
            //SHOULD MAKE AN EXTERNAL FILE OF THESE ALLIANCES
            var resRoles = ["Merlin", "Percival", "Resistance", "Isolde", "Tristan"];
            var spyRoles = ["Assassin", "Morgana", "Spy", "Mordred", "Oberon"];


            for (var i = 0; i < records.length; i++) {
                if (records[i].ladyChain.length > 0) {


                    //if the first person who held the card is a res
                    if (resRoles.indexOf(records[i].ladyChain[0]) !== -1) {
                        if (records[i].winningTeam === "Resistance") {
                            ladyBreakdown.resStart.resWin++;
                        }
                        else if (records[i].winningTeam === "Spy") {
                            ladyBreakdown.resStart.spyWin++;
                        }
                    }
                    //if the first person who held the card is a spy
                    else if (spyRoles.indexOf(records[i].ladyChain[0]) !== -1) {
                        if (records[i].winningTeam === "Resistance") {
                            ladyBreakdown.spyStart.resWin++;
                        }
                        else if (records[i].winningTeam === "Spy") {
                            ladyBreakdown.spyStart.spyWin++;
                        }
                    }
                    else {
                        console.log("ERROR no alliance assigned to role: " + records[i].ladyChain[0]);
                    }
                }
            }
            obj.ladyBreakdown = ladyBreakdown;



            //**********************************************
            //Getting the average duration of each game
            //**********************************************
            var averageGameDurations = [];
            var countForGameSize = [];
            for (var i = 5; i < 11; i++) {
                averageGameDurations[i] = new Date(0);
                countForGameSize[i] = 0;
            }

            // console.log(averageGameDurations);

            for (var i = 0; i < records.length; i++) {
                var duration = new Date(records[i].timeGameFinished.getTime() - records[i].timeGameStarted.getTime());

                // console.log(records[i].numberOfPlayers);

                averageGameDurations[records[i].numberOfPlayers] = new Date(averageGameDurations[records[i].numberOfPlayers].getTime() + duration.getTime());
                countForGameSize[records[i].numberOfPlayers]++;
            }
            obj['5paverageGameDuration'] = new Date(averageGameDurations[5].getTime() / countForGameSize['5']);
            obj['6paverageGameDuration'] = new Date(averageGameDurations[6].getTime() / countForGameSize['6']);
            obj['7paverageGameDuration'] = new Date(averageGameDurations[7].getTime() / countForGameSize['7']);
            obj['8paverageGameDuration'] = new Date(averageGameDurations[8].getTime() / countForGameSize['8']);
            obj['9paverageGameDuration'] = new Date(averageGameDurations[9].getTime() / countForGameSize['9']);
            obj['10paverageGameDuration'] = new Date(averageGameDurations[10].getTime() / countForGameSize['10']);

            obj.timeCreated = new Date();

            clientStatsData = obj;


            console.log("Done processing, now saving.");

            statsCumulative.remove({}, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Removed past cumulative object");
                    statsCumulative.create({ data: JSON.stringify(clientStatsData) }, function (err) {
                        console.log("Successfully saved new cumulative object");
                    });
                }
            });

            // res.status(200).send(clientStatsData);
        }
    });
}

router.get("/updateStats", function (req, res) {
    setTimeout(hardUpdateStatsFunction, 5000);
    res.send("Starting update...");
});



router.get("/ajax/profile/getProfileData/:profileUsername", function (req, res) {
    User.findOne({ username: req.params.profileUsername }, function (err, foundUser) {
        if (err) {
            console.log(err);
            res.status(200).send("error");
        }
        else {
            if (foundUser) {
                var sendUserData = {};
                sendUserData.username = foundUser.username;
                sendUserData.avatarImgRes = foundUser.avatarImgRes;
                sendUserData.avatarImgSpy = foundUser.avatarImgSpy;
                sendUserData.nationality = foundUser.nationality;
                sendUserData.nationCode = foundUser.nationCode;
                sendUserData.dateJoined = foundUser.dateJoined;
                sendUserData.biography = foundUser.biography;
                sendUserData.hideStats = foundUser.hideStats;

                if (!foundUser.hideStats) {
                    sendUserData.totalGamesPlayed = foundUser.totalGamesPlayed;
                    sendUserData.totalWins = foundUser.totalWins;
                    sendUserData.totalLosses = foundUser.totalLosses;
                    sendUserData.totalTimePlayed = foundUser.totalTimePlayed;
                    sendUserData.roleStats = foundUser.roleStats;
                    sendUserData.totalResWins = foundUser.totalResWins;
                    sendUserData.totalResLosses = foundUser.totalResLosses;
                }


                res.status(200).send(sendUserData);
            }




        }
    });
    // console.log("Received AJAX request");
});



router.get("/ajax/seenNotification", function (req, res) {
    // console.log("seen nofication");
    // console.log(req.query.idOfNotif);


    // console.log(mongoose.Types.ObjectId(req.query.idOfNotif));

    myNotification.findById(mongoose.Types.ObjectId(req.query.idOfNotif), function (err, notif) {
        if (err) {
            console.log(err);
        }
        if (notif && notif !== null && notif !== undefined) {
            notif.seen = true;
            var promiseReturned = notif.save();

            promiseReturned.then(function () {
                User.findOne({ username: req.user.username }).populate("notifications").exec(async function (err, foundUser) {

                    foundUser.markModified("notifications");
                    await foundUser.save();

                });
            });
        }

    });

    res.status(200).send("done");

});


router.get("/ajax/hideNotification", function (req, res) {
    // console.log("hide nofication");
    // console.log(req.query.idOfNotif);


    // console.log(mongoose.Types.ObjectId(req.query.idOfNotif));

    myNotification.findByIdAndRemove(mongoose.Types.ObjectId(req.query.idOfNotif), function (err) {
        if (err) {
            console.log(err);
        }

        if (req !== undefined && req.user !== undefined) {
            User.findOne({ username: req.user.username }).populate("notifications").exec(async function (err, foundUser) {

                foundUser.markModified("notifications");
                await foundUser.save();

            });
        }
    });

    res.status(200).send("done");

});

router.get("/ajax/hideAllNotifications", function (req, res) {
    // console.log("hide all nofications");

    User.findById(req.user._id).populate("notifications").exec(async function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        // console.log(foundUser.notifications);

        foundUser.notifications.forEach(function (notif) {
            // console.log("removing notif");
            // console.log(notif);
            myNotification.findByIdAndRemove(notif._id, function (err) {
                // console.log("callback");
            });
        });

        foundUser.notifications = [];

        foundUser.markModified("notifications");
        foundUser.save();

    });
    res.status(200).send("done");
});




//=====================================
//Forum
//=====================================
//this part should be in another file now.
// router.get("/forum", function(req, res){
// 	res.render("forum", {currentUser: req.user});
// })



//=====================================
//MIDDLEWARE
//=====================================
// function isLoggedIn(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	}
// 	console.log("User is not logged in");
// 	res.redirect("/");
// }

// function usernameToLowerCase(req, res, next){
// 	res.app.locals.originalUsername = req.body.username;
// 	req.body.username = req.body.username.toLowerCase();
// 	next();
// }

function escapeTextUsername(req, res, next) {
    req.body.username = escapeText(req.body.username);
    next();
}

function sanitiseUsername(req, res, next) {

    req.body.username = sanitizeHtml(req.body.username, {
        allowedTags: [],
        allowedAttributes: []
    });

    next();
}

var bannedIps = [];
var foundBannedIpsArray = [];
//load it once on startup
// updateBannedIps();

function updateBannedIps() {
    return banIp.find({}, function (err, foundBannedIps) {
        if (err) { console.log(err); }
        else {
            bannedIps = [];
            foundBannedIpsArray = [];
            // console.log(foundBannedIps);
            if (foundBannedIps) {
                foundBannedIps.forEach(function (oneBannedIp) {
                    bannedIps.push(oneBannedIp.bannedIp);
                    foundBannedIpsArray.push(oneBannedIp);
                });
            }
        }
    }).exec();
}


async function checkIpBan(req, res, next) {
    var clientIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await updateBannedIps();

    if (bannedIps.indexOf(clientIpAddress) === -1) {
        // console.log("NEXT");
        next();
    }
    else {
        var index = bannedIps.indexOf(clientIpAddress);

        var username = req.body.username || req.user.username;
        username = username.toLowerCase();

        if (!foundBannedIpsArray[index].usernamesAssociated) {
            foundBannedIpsArray[index].usernamesAssociated = [];
        }

        //if their username isnt associated with the ip ban, add their username to it for record.
        if (foundBannedIpsArray[index].usernamesAssociated.indexOf(username) === -1) {
            foundBannedIpsArray[index].usernamesAssociated.push(username);
        }

        foundBannedIpsArray[index].save();


        req.flash("error", "You have been banned.");
        res.redirect("/");
    }
}

async function checkCurrentBan(req, res, next) {

    // var currentModActions = [];
    // //load up all the modActions that are not released yet and are bans
    // await modAction.find({ whenRelease: { $gt: new Date() }, type: "ban" }, function (err, allModActions) {

    // 	for (var i = 0; i < allModActions.length; i++) {
    // 		currentModActions.push(allModActions[i]);
    // 	}
    // });

    // for (var i = 0; i < currentModActions.length; i++) {
    // 	if (currentModActions[i].bannedPlayer !== undefined && req.user !== undefined && req.user.username.toString() === currentModActions[i].bannedPlayer.username.toString()) {
    // 		if (currentModActions[i].type === "ban") {
    // 			console.log("TRUE");
    // 			console.log(currentModActions[i]);
    // 			console.log(req.user.username);
    // 			console.log(currentModActions[i].bannedPlayer.username);
    // 			var message = "You have been banned. The ban will be released on " + currentModActions[i].whenRelease + ". Ban description: '" + currentModActions[i].descriptionByMod + "'";
    // 			message += " Reflect on your actions.";
    // 			req.flash("error", message);
    // 			res.redirect("/")

    // 			// console.log(req.user.username + " is still banned and cannot join the lobby.");
    // 			return;
    // 		}
    // 	}
    // }

    next();

}


module.exports = router;


function usernameContainsBadCharacter(str) {
    //only allow alphanumerical
    var regx = /^[A-Za-z0-9]+$/;

    if (str.includes('&amp;') ||
        str.includes('&lt;') ||
        str.includes('&gt;') ||
        str.includes('&apos;') ||
        str.includes('&quot;') ||
        str.includes("[") ||
        str.includes("]") ||
        str.includes("/") ||
        str.includes("\\") ||
        str.includes("&") ||
        str.includes(";")
    ) {
        return true;
    }
    else if (!regx.test(str)) {
        return true;
    }
    else {
        return false;
    }

}


function escapeText(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;')
        .replace(/(?:\r\n|\r|\n)/g, ' <br>');
};


var defaultValuesForUser = {
    avatarImgRes: null,
    avatarImgSpy: null,

    totalTimePlayed: 0,
    totalGamesPlayed: 0,

    totalWins: 0,
    totalResWins: 0,
    totalLosses: 0,
    totalResLosses: 0,

    winsLossesGameSizeBreakdown: {},

    nationality: "",
    timeZone: "",
    biography: "",

    roleStats: {
        "5p": {
            "merlin": {

            },
            "percival": {

            },
            "assassin": {

            },
            "morgana": {

            },
            "spy": {

            },
            "resistance": {

            }
        }
    }
}
