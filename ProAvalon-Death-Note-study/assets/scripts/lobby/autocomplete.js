
var autoCompleteStrs = [];

var lastKeyPress;
$(".chat-message-input").on('keydown', function (e) {
    // console.log(e.which);   

    //if person presses the 'tab' button.
    if (e.which == 9) {
        e.preventDefault();
        // do your code

        // console.log('a');
        // console.log($(e.target).val());
        var newWord;
        var lastWord;
        if (lastKeyPress === 9) {
            // console.log(goodPossibleStrings);
            //if our last keypress is still a tab, put the next possible autocomplete str in
            lastWord = currentAutoCompleteWord;

            if (goodPossibleStrings.indexOf(lastWord) + 1 > goodPossibleStrings.length - 1) {
                newWord = goodPossibleStrings[0];
            }
            else {
                // console.log("last word: " + lastWord);
                newWord = goodPossibleStrings[goodPossibleStrings.indexOf(lastWord) + 1];
            }

            //set the new current auto complete word
            currentAutoCompleteWord = newWord;
        }
        else {
            //if its out first time pressing tab
            lastWord = getLastWord($(e.target).val());
            newWord = autoComplete($(e.target).val(), autoCompleteStrs.sort());
        }
        //if we get a new word
        if (newWord) {
            //get the new str after replacing
            //split the current stuff up:
            var splitted = $(e.target).val().split(" ");
            splitted[splitted.length - 1] = newWord;

            var together = "";
            for (var i = 0; i < splitted.length; i++) {
                together = together + splitted[i];
                if (i !== splitted.length - 1) {
                    together += " ";
                }
            }

            var newStr = together;

            newStr = newStr.split(" ");
            newNewStr = "";
            for (var s of newStr) {
                if (s.includes("<span")) {
                    break;
                }
                newNewStr += s + " ";
            }

            newNewStr = newNewStr.slice(0, newNewStr.length - 1);

            //set the new text
            $(e.target).val(newNewStr);
        }
    }
    lastKeyPress = e.which;
});

function getLastWord(words) {
    var n = words.split(" ");
    return n[n.length - 1];
}

//state variables
var goodPossibleStrings = [];
var currentAutoCompleteWord = "";

function autoComplete(currentStr, possibleStrs) {
    var lastWord = getLastWord(currentStr);
    // console.log(lastWord);

    goodPossibleStrings = [];

    //for every possible auto complete str
    for (var i = 0; i < possibleStrs.length; i++) {

        //for the length of the last word
        //check each character. if they match good, if they dont, break
        for (var j = 0; j < lastWord.length; j++) {
            if (lastWord[j].toLowerCase() === possibleStrs[i][j].toLowerCase()) {
                //good
            }
            else {
                //bad
                break;
            }

            if (j === lastWord.length - 1) {
                //passed all the checks, add to good possible strings
                goodPossibleStrings.push(possibleStrs[i]);
            }
        }
    }

    // console.log(goodPossibleStrings);
    currentAutoCompleteWord = goodPossibleStrings[0];
    return currentAutoCompleteWord;
}