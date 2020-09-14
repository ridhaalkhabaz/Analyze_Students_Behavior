const fs = require('fs')
const JSONStream = require('JSONStream');
let sqlMap = new Map([["select", "T"], ["from", "T"], ["where", "T"], ["naturejoin", "T"], 
["leftouterjoin","T"],["rightouterjoin", "T"], ["join", "T"], ["groupby", "T"], ["having", "T"], 
["createview", "T"], ["orderby", "T"], ["insertinto", "T"],["values", "T"], ["deletefrom", "T"], 
["update","T"], ["set","T"],]);

var ed = require('edit-distance');
var insert, remove, update;
insert = remove = function(node) { return 1; };
update = function(stringA, stringB) { return stringA !== stringB ? 1 : 0; };


var final = 0;
var finalSql = [];
var finalStr = [];
var compareStr = [];  //store substring after sql-keyword-parsing
var compareSql = [];  //store sql-keyword

//helper function
function sqlParse(arg) {
    compareSql.length = 0;
    compareStr.length = 0;
    
    //change string to lower case, replace all new line characters with space, 
    //and split the string by space.
    var str = arg.toLowerCase();
    str = str.replace(/(\r\n|\n|\r)/gm, " ");
    str = str.replace(/\(/g, " ( ");
    str = str.replace(/\)/g, " ) ");
    
    var res = str.split(" ");
    
    //sql parse by keywords
    var temp = "";
    for (var i = 0; i < res.length; ) {
        if(res[i] == "nature" && i + 1 < res.length && res[i+1] == "join") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("naturejoin");
            i += 2;
        } else if(res[i] == "create" && i + 1 < res.length && res[i+1] == "view") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("createview");
            i += 2;
        } else if(res[i] == "insert" && i + 1 < res.length && res[i+1] == "into") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("insertinto");
            i += 2;
        } else if(res[i] == "delete" && i + 1 < res.length && res[i+1] == "from") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("deletefrom");
            i += 2;
        } else if(res[i] == "order" && i + 1 < res.length && res[i+1] == "by") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("orderby");
            i += 2;
        } else if (res[i] == "group" && i + 1 < res.length && res[i+1] == "by"){
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("groupby");
            i += 2;
        } else if(res[i] == "left" && i + 2 < res.length && res[i+1] == "outer" && res[i+2] == "join") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("leftouterjoin");
            i += 3;
        } else if(res[i] == "right" && i + 2 < res.length && res[i+1] == "outer" && res[i+2] == "join") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push("rightouterjoin");
            i += 3;
        } else if (sqlMap.get(res[i]) == "T") {
            if(temp != "") {
                compareStr.push(temp);
                temp = "";
            }
            compareSql.push(res[i]);
            i += 1;
        } else {
            temp += res[i];
            i += 1;
        }
    }
    if(temp != "") {
        compareStr.push(temp);
    }
    if (final == 1) {
        finalSql.length = 0;
        finalStr.length = 0;
        for(var j = 0; j < compareSql.length; j++) {
            //console.log(compareSql[j]);
            finalSql.push(compareSql[j]);
        }
        for(var j = 0; j < compareStr.length; j++) {
            //console.log(compareStr[j]);
            finalStr.push(compareStr[j]);
        }
        final = 0;
    }
    for(var j = 0; j < compareSql.length; j++) {
        console.log(compareSql[j]);
    }
    for(var j = 0; j < compareStr.length; j++) {
        console.log(compareStr[j]);
    }
    console.log("--------------------------------");
}

function disComputation() {
    var dis = 0;
    if(finalSql.length > compareSql.length) {
        for(var i = 0; i < compareSql.length; i++) {
            var lev = ed.levenshtein(finalSql[i], compareSql[i], insert, remove, update);
            dis += lev.distance;
        }
        for(var j = compareSql.length; j < finalSql.length; j++) {
            var lev = ed.levenshtein(finalSql[j], "", insert, remove, update);
            dis += lev.distance;
        }
    } else {
        for(var i = 0; i < finalSql.length; i++) {
            var lev = ed.levenshtein(finalSql[i], compareSql[i], insert, remove, update);
            dis += lev.distance;
        }
        for(var j = finalSql.length; j < compareSql.length; j++) {
            var lev = ed.levenshtein(compareSql[j], "", insert, remove, update);
            dis += lev.distance;
        }
    }
    if(finalStr.length > compareStr.length) {
        for(var i = 0; i < compareStr.length; i++) {
            var lev = ed.levenshtein(finalStr[i], compareStr[i], insert, remove, update);
            dis += lev.distance;
        }
        for(var j = compareStr.length; j < finalStr.length; j++) {
            var lev = ed.levenshtein(finalStr[j], "", insert, remove, update);
            dis += lev.distance;
        }
    } else {
        for(var i = 0; i < finalStr.length; i++) {
            var lev = ed.levenshtein(finalStr[i], compareStr[i], insert, remove, update);
            dis += lev.distance;
        }
        for(var j = finalStr.length; j < compareStr.length; j++) {
            var lev = ed.levenshtein(compareStr[j], "", insert, remove, update);
            dis += lev.distance;
        }
    }
    //console.log(dis);
    return dis;
}



const mySqlRegex = /(\d+)\s\((.+)\):\s(.+)/;
const failedCompletelyRegex = /([^ ]+)/;
const failedCompletelyFirstWordToCode = {
    "\'ascii\'": -1,
    "\'utf-8\'": -2,
    "Unread": -3,
    "Catastrophic": -4,

};

const semester = "fa19"; // "sp19" "su19" "fa19"
const baseDir = "../../cs411" + semester + ".tables/";

const questionsBySemester = {
    "sp19": [],
    "su19": [3689891, 3689892, 3689893, 3689894, 3689895, 3689896, 3689897, 3689898],
    "fa19": [3893280, 3893281, 3893282, 3893283, 3893285, 3893286, 3893287, 3893288, 3969325, 3969333], 
}

var variants;
var submissions;

try {

	variants = fs.readFileSync(baseDir + 'variants.json', 'utf8');

} catch (err) {
	console.error(err);
}

// try {

// 	submissions = fs.readFileSync(baseDir + 'submissions.json', 'utf8');

// } catch (err) {
// 	console.error(err);
// }


allVariants = JSON.parse(variants);
// allSubmissions = JSON.parse(submissions)

newSubmissions = [];

const jsonstream = JSONStream.parse("*");
jsonstream.on('close', () => {
    // console.log("done");
    // printErrorCodeTable()
    //console.log(JSON.stringify(newSubmissions, null, 2));

    // console.log("[");
    // for (let sub of newSubmissions) {
    //     console.log(JSON.stringify(sub));
    //     console.log(",");
    // }
    // console.log("]");

    //--------new added---------- write result into file.
    const fs = require('fs')
    let sorted = {}
    newSubmissions.forEach(element => {
        let id = element.question;   //Outer key.
        let userId = element.user;   //Inner key
        if(!(id in sorted)) {
            //Create a list for each question.
            sorted[id] = {}
        } 
        if(!(userId in sorted[id])){
            //Create an array for each user under each question.
            //Store their submissions.
            sorted[id][userId] = [];
            sorted[id][userId].push(element.contents);
        } else {
            sorted[id][userId].push(element.contents);
        }
    });
    for (let key in sorted) {
        // Outer key is the question id. Group by question id.
        let dir = "../../myData/" + key;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        let five = {}; // less than 5 submissions
        let ten = {}; // 5 < submissions <= 10
        let twenty = {}; // 10 < submissions <= 20
        let thirty = {}; // 20 < submissions <= 30
        let forty = {}; // 30 < submissions <= 40
        let fifty = {}; // 40 < submissions <= 50
        let sixty = {}; // 50 < submissions <= 60
        let seventy = {}; // 60 < submissions <= 70
        let eighty = {}; // 70 < submissions <= 80
        let ninty = {}; // 80 < submissions <= 90
        let hundred = {}; // 90 < submissions <= 100
        let overHundred = {}; // over hundred submissions

        let str = "";
        for (let innerKey in sorted[key]) {
            // Innerkey is the userId. 
            let num = sorted[key][innerKey].length;
            str += "User: " + innerKey + " Number of submissions: " + num + '\n';
            for (var i = 0; i < sorted[key][innerKey].length; i++) {
                str += "Submission number " + (i+1) + ": " + sorted[key][innerKey][i] + '\n';
            }
            //Group by number of submissions.
            if(num <= 5) {
                five[innerKey] = num;
            } else if (num > 5 && num <= 10) {
                ten[innerKey] = num;
            } else if (num > 10 && num <= 20) {
                twenty[innerKey] = num;
            } else if (num > 20 && num <= 30) {
                thirty[innerKey] = num;
            } else if (num > 30 && num <= 40) {
                forty[innerKey] = num;
            } else if (num > 40 && num <= 50) {
                fifty[innerKey] = num;
            } else if (num > 50 && num <= 60) {
                sixty[innerKey] = num;
            } else if (num > 60 && num <= 70) {
                seventy[innerKey] = num;
            } else if (num > 70 && num <= 80) {
                eighty[innerKey] = num;
            } else if (num > 80 && num <= 90) {
                ninty[innerKey] = num;
            } else if (num > 90 && num <= 100) {
                hundred[innerKey] = num;
            } else {
                overHundred[innerKey] = num;
            }

            //For each user, analyze his/her submissions.
            //First get his/her final submissions.
            var lenOfArr = sorted[key][innerKey].length;
            var finalSub = sorted[key][innerKey][lenOfArr-1]; //final sub string
            final = 1;
            sqlParse(finalSub);
            
            var userDis = innerKey + ": ";

            //For each submission, compute the edit distance between the submission
            //and the final submission, and store to a string.
            for (var j = 0; j < lenOfArr - 1; j++) {
                // Remove all space and new line character.
                sqlParse(sorted[key][innerKey][j]);
                var dis = disComputation();
                userDis += dis.toString() + " ";
            } 
            // Store the edit distance string to a .txt file inside user directory.
            let userDir = "../../myData/" + key + "/" + innerKey;
            if (!fs.existsSync(userDir)){
                fs.mkdirSync(userDir);
            }
            
            fs.writeFileSync(userDir + "/" + "distance.txt", userDis);
        }
        
        // For each question, write final result into file.
        fs.writeFileSync(dir + "/" + "result.txt", str);
        let ano_str = "Less than five submissions: " + '\n'; 
        for (let k in five) {
            ano_str += "User: " + k + " number: " + five[k] + '\n';
        }
        ano_str += "5 to 10(included) submissions: " + '\n';
        for (let k in ten) {
            ano_str += "User: " + k + " number: " + ten[k] + '\n';
        }
        ano_str += "10 to 20(included) submissions: " + '\n';
        for (let k in twenty) {
            ano_str += "User: " + k + " number: " + twenty[k] + '\n';
        }
        ano_str += "20 to 30(included) submissions: " + '\n';
        for (let k in thirty) {
            ano_str += "User: " + k + " number: " + thirty[k] + '\n';
        }
        ano_str += "30 to 40(included) submissions: " + '\n';
        for (let k in forty) {
            ano_str += "User: " + k + " number: " + forty[k] + '\n';
        }
        ano_str += "40 to 50(included) submissions: " + '\n';
        for (let k in fifty) {
            ano_str += "User: " + k + " number: " + fifty[k] + '\n';
        }
        ano_str += "50 to 60(included) submissions: " + '\n';
        for (let k in sixty) {
            ano_str += "User: " + k + " number: " + sixty[k] + '\n';
        }
        ano_str += "60 to 70(included) submissions: " + '\n';
        for (let k in seventy) {
            ano_str += "User: " + k + " number: " + seventy[k] + '\n';
        }
        ano_str += "70 to 80(included) submissions: " + '\n';
        for (let k in eighty) {
            ano_str += "User: " + k + " number: " + eighty[k] + '\n';
        }
        ano_str += "80 to 90(included) submissions: " + '\n';
        for (let k in ninty) {
            ano_str += "User: " + k + " number: " + ninty[k] + '\n';
        }
        ano_str += "90 to 100(included) submissions: " + '\n';
        for (let k in hundred) {
            ano_str += "User: " + k + " number: " + hundred[k] + '\n';
        }
        ano_str += "Over 100 submissions: " + '\n';
        for (let k in overHundred) {
            ano_str += "User: " + k + " number: " + overHundred[k] + '\n';
        }
        fs.writeFileSync(dir + "/" + "stat_result.txt", ano_str);
    }
});

//"submitted_answer":{"_files": [{"name": "query.js", "contents": "cHJldHR5KCk="}]
//"feedback":{"job_id": 15841976, "results": {"score": 0, "output": "Expected results\n================\n13\n\n\nActual results\n==============\n\"2019-07-26T23:52:19.107+0000 E QUERY    [js] ReferenceError: pretty is not defined :\"\n\"@(shell):1:1\"\n", "succeeded": false}, "end_time": "2019-07-26T23:52:20.114Z", "succeeded": true, "start_time": "2019-07-26T23:52:17.123Z", "received_time": "2019-07-26T23:52:14.163Z"},"grading_requested_at":"201

jsonstream.on('data', (data) => {
// for(var i = 0; i < allSubmissions.length; i++) {

  var sub = {
    user : 0,
    question : 0,
    variant : 0,
    timestamp : "",
    output : "n/a",
    score : 0,
    contents : "",
    result : "Unknown",
    //totalTime: ""//,
    ultimatelyCorrect: false
  }
    // parseSub = allSubmissions[i];
    parseSub = data;
	if(!parseSub.hasOwnProperty('submitted_answer')) { return;}
    if(parseSub.submitted_answer == null || !parseSub.submitted_answer.hasOwnProperty('_files')) { return;}
    // if (parseSub.submitted_answer._files[0].name !== "query.sql") { return; }
	if(parseSub.hasOwnProperty('submitted_answer') && parseSub.submitted_answer.hasOwnProperty('_files')){
		sub.score = parseSub.score;
		sub.timestamp = parseSub.date;

        // console.log(parseSub.submitted_answer._files[0].name);
		var b = new Buffer(parseSub.submitted_answer._files[0].contents, 'base64')
		sub.contents = b.toString();

		sub.variant = parseSub.variant_id;
		for (var j = 0; j < allVariants.length; j++) {
			parseVar = allVariants[j];
			if(parseSub.variant_id == parseVar.id) {
				sub.user = parseVar.user_id;
				sub.question = parseVar.question_id;
                sub.totalTime = parseVar.duration;
                sub.variant = parseVar.id;
        // console.log(sub.question);
				break;
			}

		}
    //This is so freakin' bad but I'm going blank so here's one way to figure out if someone got the answer correct eventually
    // if(sub.score == 1) {
    //   sub.ultimatelyCorrect = true;
    // } else {
    //   for (var j = 0; j < allSubmissions.length; j++){
    //     if (parseSub.variant_id == allSubmissions[j].variant_id && allSubmissions[j].score == 1) {
    //       sub.ultimatelyCorrect = true;
    //       break;
    //     }
    //   }
    // }


    //TODO: make sure that all feedback is captured
    if (parseSub.hasOwnProperty('feedback')) {
        if (parseSub.feedback != null && parseSub.feedback.hasOwnProperty('results')) {
            if (parseSub.feedback.results != null) {
                // output or message
                if(parseSub.feedback.results.output != null) {
                    sub.output = parseSub.feedback.results.output;
                } else if (parseSub.feedback.results.message){
                    sub.output = parseSub.feedback.results.message;
                    // messages should only be with an error, output is with queries that run
                    sub.result = "SyntacticError"
                    const match = mySqlRegex.exec(sub.output);

                    if (match) {
                        // console.log(match);
                        sub.errorDetails = {
                            errorCode: match[1], 
                            sqlState: match[2],
                            message: match[3]
                        };
                        // console.log(sub.errorDetails);
                    } else {
                        const match = failedCompletelyRegex.exec(sub.output);
                        const errorCode = failedCompletelyFirstWordToCode[match[0]];
                        sub.errorDetails = {
                            errorCode: errorCode, 
                            message: sub.output
                        };
                        
                        // TODO for now, I just don't want to include these in the analysis at all
                        // maybe I'll change my mind later 
                        return;
                    }
                    // console.log(match);
                }

            }
        }
    }

    //Cheap string parsing to get result
    if(sub.score == 1){
      sub.result = "CorrectSolution"
    } else if (sub.output.includes("Expected results")) {
      sub.result = "SemanticError"        
    } else if (sub.output.includes("ERROR") || sub.output.includes("Error") ){
      sub.result = "SyntacticError"
    //   const match = mySqlRegex.exec(sub.output);
    //   console.log(match);
    } 


    // if submission == one of the ones we're looking for
    //(*Known*) Summer question ids: 3689891,3689892,3689893,3689894,3689895,3689896,3689897,3689898
    //Fall question ids: 3902462, 3902464, 3902465, 3902466, 3902467, 4014112, 4017607, 4017605, 4014114, 4014115
    //if(sub.question)
    //nvm
    //FALL QUESTIONS
    //if(sub.question == 3902462 || sub.question == 3902464 || sub.question == 3902465 || sub.question == 3902466 || sub.question == 3902467 || sub.question == 4014112 || sub.question == 4017607 || sub.question == 4017605 || sub.question == 4014114 || sub.question == 4014115){
    // if (sub.question == 3689952) continue;  // the CafeDB question that is like a practice sandbox for students

    if (questionsBySemester[semester].indexOf(sub.question) !== -1) {
        newSubmissions.push(sub);    
    } 
    //}

	}

// }

});


fs.createReadStream(baseDir + 'submissions.json', {encoding: 'utf8'})
    .pipe(jsonstream);

// var s = JSON.stringify(newSubmissions, null, 2);

