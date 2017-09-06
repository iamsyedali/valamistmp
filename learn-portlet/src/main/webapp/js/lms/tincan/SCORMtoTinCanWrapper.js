// SCORM Tracking to TinCan LRS wrapper

/*============GLOBAL VARIABLES==============*/
var valueStorage = {}, //stores values.
    attemptCompleted = false, // at the end of attempt check that statement with result sent one time
    resultChanged = false, //used to track if the completion status has been changed but not yet reported.
    initialized = false, // session initialized
    interactionIndex = -1, // interaction index
    questionCount = 0,      // counter for question in one activity
    prevInteractionIndex = -1,      // variable for avoid sending intercation statement twice
    initialDuration = "PT0S", // initial duration at the start session
    offsetDuration = "PT0S"; // offset duration between sessions

var currentPage = 0,
    scoredCount = 0,
    scores = [];

var currentActivityID = -1, // current activity id
    currentPackageID = -1, // current package id
    currentOrganizationID = -1; // current organization id

var currentPackageURI = null, currentActivityURI = null;

var registrationId; // registration id of the document for State API

var statementsCollection = new Object(); // Statement template collection for different verbs

var packageActivity = null; // package activity for start and finish statements

var stateIds = null; // State document identifier
/*============END GLOBAL VARIABLES==============*/

var urlPortal = themeDisplay.getPortalURL() + "/question/score";

// Create actor object
function SetActor(tincanActor) {
    TincanHelper.SetActor(JSON.parse(tincanActor));
}

// we need to store attempt statement id
// all next statements will be linked to it
// we can't use 'valueStorage' because it broken
var attemptedStatementRef;
function GetAttemptedStatementRef() {
    return attemptedStatementRef;
}

function SetAttemptedStatementId(statementId) {
    attemptedStatementRef = new TinCan.StatementRef({
        "objectType": "StatementRef",
        "id": statementId
    });
}

// Clear and init global vars
function InitVars() {
    valueStorage = {},
    interactionIndex = -1,
    questionCount = 0,
    prevInteractionIndex = -1,
    attemptCompleted = false,
    resultChanged = false,
    initialDuration = "PT0S",
    offsetDuration = "PT0S",
    scoreAdded = false;

    registrationId = null;

    currentPage = lessonViewer.playerLayoutView.navigationNodeCollection.indexOf (
        lessonViewer.playerLayoutView.navigationNodeCollection.find (function(el) {
                return el.get('active')
            }
        )
    );
    scoredCount = lessonViewer.playerLayoutView.navigationNodeCollection.length; //TODO: Is there other way to get page count?
    //Filling in empty scores
    if (scores.length < scoredCount)
        while(scores.length < scoredCount)
            scores.push(-1);
}

function StartPackageAttempt(packageID, packageName, packageDesc) {
    currentPackageID = packageID;
    scoredCount = 0;

    // set actor from user view
    var activityDefinition = new TinCan.ActivityDefinition({
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
            "en-US": packageName
        },
        description: {
            "en-US": packageDesc
        }

    });

    jQuery.ajax({
        type: 'GET',
        dataType: 'text',
        url: path.root + path.api.uri + '?prefix=' + document.location.protocol + "//" + document.location.host +
            path.root + path.api.uri + '&id=' + currentPackageID +
            '&type=package&content=' + JSON.stringify(activityDefinition),

        success: function (data) {
            currentPackageURI = JSON.parse(data).uri.replace(/"/g, '');
            //Create the activity
            packageActivity = new TinCan.Activity({
                id: currentPackageURI,
                definition: activityDefinition
            });

            var stmtToSend = TincanHelper.createStatement(packageActivity,currentPackageURI);
            stmtToSend.verb = createVerb("attempted", "http://adlnet.gov/expapi/verbs/");

            //Send the statement, no callback
            myTinCan.sendStatement(stmtToSend, function () {
            });

            SetAttemptedStatementId(stmtToSend.id);
        }
    });


}

function FinishPackageAttempt(sendCompleteStatement) {
    if (currentPackageID == -1) return;
    endAttemptSession();
    if (sendCompleteStatement) {
        var stmtToSend = new TinCan.Statement({
            actor: myTinCan.actor,
            target: packageActivity,
            context: {
                contextActivities: {
                    grouping: [
                        {id: currentPackageURI, objectType: "Activity"}
                    ]
                },
                statement: GetAttemptedStatementRef()
            }
        });
        stmtToSend.verb = createVerb("completed", "http://adlnet.gov/expapi/verbs/");

        stmtToSend.target = packageActivity;

        var result = new TinCan.Result();

        if(!!valueStorage["cmi.score.scaled"] || !!valueStorage["cmi.score.raw"]) {
            result.score = new TinCan.Score;
            result.score.scaled = valueStorage["cmi.score.scaled"];
            result.score.raw = valueStorage["cmi.score.raw"];
            result.score.min = valueStorage["cmi.score.min"];
            result.score.max = valueStorage["cmi.score.max"];
            result.score = removeEmptyProperties(result.score);

            // Calculate scaled if not present
            if (!result.score.scaled && result.score.raw) {
                if (result.score.min && result.score.max) {
                    result.score.scaled = (result.score.raw - result.score.min) / (result.score.max - result.score.min);
                }
                else {
                    result.score.scaled = result.score.raw;
                }
            }
        }
        if(!!valueStorage["cmi.success_status"]) {
            result.success = valueStorage["cmi.success_status"] == "passed";
        }
        if(!!valueStorage["cmi.completion_status"]) {
            result.completion = valueStorage["cmi.completion_status"] == "passed" || valueStorage["cmi.completion_status"] == "completed";
        }

        stmtToSend.result = result;

        //Send the statement, no callback
        myTinCan.sendStatement(stmtToSend, function () {});
    }

    // clear current package id, package completed
    currentPackageID = -1;
    currentPackageURI = null;
}


// Set target Activity object
function SetActivity(activityId, activityName, activityDesc) {
    // end session with change of the activity
    if (myTinCan.activity)
        endAttemptSession();

    InitVars();
    currentActivityID = activityId,
        currentActivityURI = null;
    currentOrganizationID = -1;

    registrationId = TinCan.Utils.getUUID();

    //Create the activity definition
    var activityDefinition = new TinCan.ActivityDefinition({
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
            "en-US": activityName
        },
        description: {
            "en-US": activityDesc
        }
    });

    function SetActivity() {
//Create the activity
        var activity = new TinCan.Activity({
            id: currentActivityURI,
            definition: activityDefinition
        });

//use this activity as default
        myTinCan.activity = activity;

        // init templates of statements
        CreateTemplatesStatements();

        // set state document for saving states
        InitStateDocument();
    }

    if (currentActivityID === undefined)
        return;

    if (currentActivityID.indexOf('http') == -1) {
        currentActivityURI = document.location.protocol + "//" + document.location.host + encodeURIComponent(currentActivityID.indexOf('/') == 0 ? currentActivityID : '/' + currentActivityID);
        SetActivity();
    }
    else {
        jQuery.ajax({
            type: 'GET',
            dataType: 'text',
            url: path.root + path.api.uri + '?prefix=' + document.location.protocol + "//" + document.location.host +
                path.root + path.api.uri + '&id=' + encodeURIComponent(currentActivityID) +
                '&type=activity&content=' + JSON.stringify(activityDefinition),

            success: function (data) {
                currentActivityURI = JSON.parse(data).uri;
                SetActivity();
            }
        });
    }
}


function CreateTemplatesStatements() {
//For each verb, create an instance of the Tin Can Verb Object and add it to the collection for later use.
    statementsCollection = new Object();
//attempted - an attempt has happened but the session ended before it was completed.
    statementsCollection.attempted = createStatement();
    statementsCollection.attempted.verb = createVerb("attempted", "http://adlnet.gov/expapi/verbs/");
    statementsCollection.attempted.result = createResult(false);

    //experienced - an attempt has happened but no result.
    statementsCollection.experienced = createStatement();
    statementsCollection.experienced.verb = createVerb("experienced", "http://adlnet.gov/expapi/verbs/");
    statementsCollection.experienced.result = createResult(true);

//completed - an attempted has been completed but we are making no assertions as to whether it was successful or not
    statementsCollection.completed = createStatement();
    statementsCollection.completed.verb = createVerb("completed", "http://adlnet.gov/expapi/verbs/");
    statementsCollection.completed.result = createResult(true);

//passed - an attempt has been completed successfully
    statementsCollection.passed = createStatement();
    statementsCollection.passed.verb = createVerb("passed", "http://adlnet.gov/expapi/verbs/");
    statementsCollection.passed.result = createResult(true, true);

//failed - an attempt has been completed but it was not successful
    statementsCollection.failed = createStatement();
    statementsCollection.failed.verb = createVerb("failed", "http://adlnet.gov/expapi/verbs/");
    statementsCollection.failed.result = createResult(true, false);
}


// Create State Ids and load state document if exists in LRS
function InitStateDocument() {
    stateIds = {
        actor: myTinCan.actor,
        activity: myTinCan.activity//,
        //registration: registrationId
    };

    // GetStateDocument();
}

var SCORMDataCache = function (property, value) {

    //Ensure we have a valid property to work with
    if (typeof property === "undefined") {
        return false;
    }

    //If cached value exists, return it
    if (typeof valueStorage[property] !== "undefined") {
        return valueStorage[property];
    }

    //Otherwise add to cache
    if (typeof value !== "undefined") {
        valueStorage[property] = value;
    }

    return false;

};

// Create the statement with default actor and activity
function createStatement() {
    return  TincanHelper.createStatement(myTinCan.activity,currentPackageURI,registrationId);
}

// create the Tincan Result object
function createResult(completion, success) {
    if (typeof success == 'undefined') {
        return new TinCan.Result({
            completion: completion,
            extensions: {
                urlPortal: null
            }
        });
    }
    else {
        return new TinCan.Result({
            completion: completion,
            success: success,
            extensions: {
                urlPortal: null
            }
        });
    }
}

// create the TinCan Verb object
function createVerb(verb, library, display) {
    return TincanHelper.createVerb(verb, library, display);
}

/*============DURATION FUNCTIONS==============*/
function convertCMITimespanToSeconds(CMITimespan) {
    var isValueNegative = (CMITimespan.indexOf('-') >= 0);
    var indexOfT = CMITimespan.indexOf("T");
    var indexOfH = CMITimespan.indexOf("H");
    var indexOfM = CMITimespan.indexOf("M");
    var indexOfS = CMITimespan.indexOf("S");

    var hours;
    var minutes;
    var seconds;

    if (indexOfH == -1) {
        indexOfH = indexOfT;
        hours = 0;
    }
    else {
        hours = parseInt(CMITimespan.slice(indexOfT + 1, indexOfH));
    }


    if (indexOfM == -1) {
        indexOfM = indexOfT;
        minutes = 0;
    }
    else {
        minutes = parseInt(CMITimespan.slice(indexOfH + 1, indexOfM));
    }


    seconds = parseInt(CMITimespan.slice(indexOfM + 1, indexOfS));

    var timespanInSeconds = parseInt((((hours * 60) + minutes) * 60) + seconds);
    if (isNaN(timespanInSeconds)) {
        timespanInSeconds = 0
    }

    if (isValueNegative) {
        timespanInSeconds = timespanInSeconds * -1;
    }


    return timespanInSeconds;
}

function convertSecondsToCMITimespan(inputSeconds) {
    var hours, minutes, seconds,
        i_inputSeconds = parseInt(inputSeconds);
    var inputIsNegative = "";
    if (i_inputSeconds < 0) {
        inputIsNegative = "-";
        i_inputSeconds = i_inputSeconds * -1;
    }

    hours = parseInt((i_inputSeconds) / 3600);
    minutes = parseInt(((i_inputSeconds) % 3600) / 60);
    seconds = parseInt(((i_inputSeconds) % 3600) % 60);

    var rtnStr = inputIsNegative + "PT";
    if (hours > 0) {
        rtnStr += hours + "H";
    }

    if (minutes > 0) {
        rtnStr += minutes + "M";
    }

    return rtnStr + seconds + "S";
}

// Reset the attempt duration timer to zero and calc offset duration
function resetAttemptDuration() {
    cacheParameter("cmi.total_time", "PT0S", false)
    initialDuration = "PT0S";
    if (valueStorage["cmi.session_time"]) {
        offsetDuration = "-" + valueStorage["cmi.session_time"];
    }
    else {
        offsetDuration = "PT0S";
    }

}

/*============END DURATION FUNCTIONS==============*/


function SetInteractionIndex(index) {
    interactionIndex = index;
    resultChanged = true;
}

function GetInteractionIndex() {
    return interactionIndex;
}

function ResetInteractionIndex() {
    interactionIndex = -1;
}

//removes any empty properties
function removeEmptyProperties(objectToTest) {
    for (i in objectToTest) {
        if (objectToTest[i] == null || objectToTest[i] == "" || (JSON.stringify(objectToTest[i]) == "{}")) {
            delete objectToTest[i];
        }
    }
    return objectToTest;
}

// Send Attempt data to LRS by TinCan
function SendAttemptData() {
    // determ that attempt is the interaction or not
    var index = GetInteractionIndex();
    if (index >= 0) {
        SendInteractionData(index);
    }
    else
        if (!(attemptCompleted)) {
            SendAttemptDataImpl();

            attemptCompleted = true;
            resetAttemptDuration();
        }
}

// Sends statement independly of success_status and complete_status
function SendAttemptDataImpl() {
    var stmtToSend;
    // choose the statement
    if (valueStorage["cmi.success_status"] == "passed" || valueStorage["cmi.completion_status"] == "passed")    // second - for support SCORM 1.2
    {

        stmtToSend = statementsCollection.passed;
    }
    else if (valueStorage["cmi.success_status"] == "failed" || valueStorage["cmi.completion_status"] == "failed")  // second - for support SCORM 1.2
    {
        stmtToSend = statementsCollection.failed;
    }
    else {
        if (valueStorage["cmi.completion_status"] == "completed") {
            stmtToSend = statementsCollection.completed;
        }
        else {
            stmtToSend = statementsCollection.experienced;
        }
    }

    //Set the score, if present
    stmtToSend.result.score = new TinCan.Score;
    stmtToSend.result.score.scaled = valueStorage["cmi.score.scaled"];
    stmtToSend.result.score.raw = valueStorage["cmi.score.raw"];
    stmtToSend.result.score.min = valueStorage["cmi.score.min"];
    stmtToSend.result.score.max = valueStorage["cmi.score.max"];
    stmtToSend.result.score = removeEmptyProperties(stmtToSend.result.score);
    stmtToSend.result.extensions[urlPortal] = valueStorage["cmi.interactions.0.weighting"] || null;

    // Calculate scaled if not present
    if (!stmtToSend.result.score.scaled && stmtToSend.result.score.raw) {
        if (stmtToSend.result.score.min && stmtToSend.result.score.max)
            stmtToSend.result.score.scaled = (stmtToSend.result.score.raw - stmtToSend.result.score.min) / (stmtToSend.result.score.max - stmtToSend.result.score.min);
        else
            stmtToSend.result.score.scaled = stmtToSend.result.score.raw;
    }

    //Set the duration
    stmtToSend.result.duration = valueStorage["cmi.total_time"];

    stmtToSend.context = stmtToSend.context || {};
    stmtToSend.context.statement = GetAttemptedStatementRef();

    //Send the statement, no callback
    myTinCan.sendStatement(stmtToSend, function () {
    });
    questionCount = 0;
    prevInteractionIndex = -1;
}


// Sends interaction statement on quiz question and etc.
function SendInteractionData(interactionIndex) {
    function convertInteractionType(interactionType){
        var result;
        if(interactionType == "fill_in") result = "fill-in";
        else if(interactionType == "long_fill_in") result = "long-fill-in";
        else result = interactionType;
        return result
    }
    if(prevInteractionIndex == interactionIndex) {
        return;
    }
    prevInteractionIndex = interactionIndex;
    questionCount++;
    var interactionDescription = "Question #" + questionCount;
    var interactionName = "Question #" + questionCount;
    if (valueStorage["cmi.interactions." + interactionIndex + ".id"])
        interactionName = valueStorage["cmi.interactions." + interactionIndex + ".id"];
    if (valueStorage["cmi.interactions." + interactionIndex + ".title"])
        interactionName = valueStorage["cmi.interactions." + interactionIndex + ".title"];
    if (valueStorage["cmi.interactions." + interactionIndex + ".description"])
        interactionDescription = valueStorage["cmi.interactions." + interactionIndex + ".description"];

    //verb
    var interactionVerb = createVerb("answered", "http://adlnet.gov/expapi/verbs/");

    var correctResponsesPattern = [];
    var correctResponsesIndex = 0;

    while (typeof valueStorage["cmi.interactions." + interactionIndex + ".correct_responses." + correctResponsesIndex + ".pattern"] !== "undefined") {
        correctResponsesPattern[correctResponsesIndex] = valueStorage["cmi.interactions." + interactionIndex + ".correct_responses." + correctResponsesIndex + ".pattern"].toString();
        correctResponsesIndex++;
    }

    //Create the activity definition
    var interactionDefinition = new TinCan.ActivityDefinition({
        type: "http://adlnet.gov/expapi/activities/cmi.interaction",
        name: {
            "en-US": interactionName
        },
        description: {
            "en-US": interactionDescription
        },
        correctResponsesPattern: correctResponsesPattern

    });
    if (valueStorage["cmi.interactions." + interactionIndex + ".type"])
        interactionDefinition.interactionType = convertInteractionType(valueStorage["cmi.interactions." + interactionIndex + ".type"]);

    var interaction_id = valueStorage["cmi.interactions." + interactionIndex + ".id"];
    if (!interaction_id)
        interaction_id = interactionIndex;

    //Create the activity
    var interactionActivity = new TinCan.Activity({
        id: myTinCan.activity.id + ':interactions#' + interaction_id,
        definition: interactionDefinition
    });

    var context = new TinCan.Context({
        parent: [
            {
                id: myTinCan.activity.id
            }
        ],
        registration: registrationId,
        contextActivities: {
            grouping: [
                {id: currentPackageURI, objectType: "Activity"}
            ]
        }
    });

    //Result
    var interactionResult = createResult(true);
    if (valueStorage["cmi.interactions." + interactionIndex + ".learner_response"])
        interactionResult.response = valueStorage["cmi.interactions." + interactionIndex + ".learner_response"].toString();
    if (valueStorage["cmi.interactions." + interactionIndex + ".latency"])
        interactionResult.duration = valueStorage["cmi.interactions." + interactionIndex + ".latency"];
    else
        interactionResult.duration = valueStorage["cmi.session_time"];
    //Score
    if (interactionActivity.definition.interactionType != "essay" && interactionActivity.definition.interactionType != "long_fill_in") {
        interactionResult.score = new TinCan.Score;
        interactionResult.score.min = 0;
        if (valueStorage["cmi.interactions." + interactionIndex + ".weighting"])
            interactionResult.score.max = parseInt(valueStorage["cmi.interactions." + interactionIndex + ".weighting"]);
        else
            interactionResult.score.max = 1;

        if (valueStorage["cmi.score.scaled"])
            interactionResult.score.scaled = valueStorage["cmi.score.scaled"];
        else
            interactionResult.score.scaled = 0;
        if (valueStorage["cmi.score.raw"])
            interactionResult.score.raw = valueStorage["cmi.score.raw"];
        switch (valueStorage["cmi.interactions." + interactionIndex + ".result"]) {
            case "correct":
                interactionResult.success = true;
                interactionResult.score.scaled = 1;
                interactionResult.score.raw = interactionResult.score.max;
                break;
            case "incorrect":
            case "wrong":
                interactionResult.success = false;
                interactionResult.score.scaled = 0;
                interactionResult.score.raw = interactionResult.score.min;
                break;
            default:
                break;
        }
    }
    interactionResult.extensions[urlPortal] = valueStorage["cmi.interactions.0.weighting"] || null;
    //TODO: add context, particularly parent. Parent pointed. Anything else?

    //Statement
    var interactionStmt = new TinCan.Statement({
        actor: myTinCan.actor,
        verb: interactionVerb,
        target: interactionActivity,
        result: interactionResult,
        context: context
    });

    interactionStmt.context.statement = GetAttemptedStatementRef();

    myTinCan.sendStatement(interactionStmt, function () {
    });

}

//
function SendState() {
    var stateJSON = JSON.stringify(valueStorage);
    if (stateIds == null)
        InitStateDocument();
    myTinCan.setState('SCORMData', stateJSON, stateIds);
}
function cacheParameter(parameter, value) {
    var cached = SCORMDataCache(parameter, value);

    if (!cached || cached !== value) {
        //Save to the value store
        valueStorage[parameter] = value;

        return true;
    }
    else {
        return false;
    }
}

function GetStateDocument() {
    var rtnState = myTinCan.getState('SCORMData', stateIds); //.state;


    if (rtnState && rtnState.state) {
        var rtnString = rtnState.state.contents;
        if (rtnString == "")
            return false;
        var rtnArray = JSON.parse(rtnString);
        jQuery.each(rtnArray, function (key, value) {
            valueStorage[key] = value;
        });
        return true;
    }
    return false;
}

function GetFromStore(parameter) {
    if (valueStorage[parameter]) {
        return valueStorage[parameter];
    }
    else {
        return "";
    }
}






