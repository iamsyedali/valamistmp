${Content.getData()}
<script src="/learn-portlet/js/vendor/tincan-min.js"> </script>
<script type="text/javascript">
    (function() {
        var hostUrl = document.location.protocol + "//" + document.location.host;
        var contentId = '${.vars["reserved-article-id"].data}';
        var contentTitle = '${.vars["reserved-article-title"].data}';
        var groupId = '${groupId}';
        var userId = ${permissionChecker.getUserId()};
        var userName = '${permissionChecker.getUser().getFullName()}';
        var userEmail = '${permissionChecker.getUser().getDisplayEmailAddress()}';
        var userUuid = '${permissionChecker.getUser().getUuid()}';
        var hostName =  "http://" + document.location.hostname;

        var verbName = 'attempted';
        var verbs = ${Verb.getData()};
        if (verbs.length > 0) {
            verbName = verbs[0];
        }
        var verbId = 'http://adlnet.gov/expapi/verbs/' + verbName;

        var createLrsClient = function(endpointSettings){
            if(endpointSettings.internal) {
                return new TinCan.LRS({
                    endpoint: endpointSettings.endpoint,
                    version: '1.0.1',
                    auth: endpointSettings.auth
                });
            } else if (endpointSettings.authType == "Basic") {
                if (endpointSettings.auth) {
                    return new TinCan.LRS({
                        endpoint: endpointSettings.endpoint,
                        version: "1.0.1",
                        auth: endpointSettings.auth
                    });
                }
            } else if (endpointSettings.authType === "OAuth") {
                if (endpointSettings.auth) {
                    return new TinCan.LRS({
                        endpoint: endpointSettings.endpoint,
                        version: "1.0.1",
                        auth: endpointSettings.auth,
                        clientSecret: endpointSettings.clientSecret
                    });
                }
            }
        };

        var createStatement = function(){
            return new TinCan.Statement({
                actor: new TinCan.Agent({id: userId, name: userName, account: new TinCan.AgentAccount({homePage: hostName, name: userUuid})}),
                verb: new TinCan.Verb({
                    id: verbId,
                    display : { "en-US" : verbName}
                }),
                target: new TinCan.Activity({
                    id: hostUrl + '/' + groupId + '/' + contentId,
                    definition:new TinCan.ActivityDefinition({
                        type: 'http://example.com/liferay_webcontent',
                        name: {'en-US': contentTitle}  //need to all or current lang
                    })}),
                result: new TinCan.Result({completion: true}),
                context: new TinCan.Context()
            });
        };

        var readTincanLrsSettings = function(callback){
            var request = new XMLHttpRequest();
            request.open('GET', '/delegate/administering/settings/lrs', true);

            request.onreadystatechange = function() {
                if (this.readyState === 4){
                    if (this.status >= 200 && this.status < 400){
                        var data = this.responseText;

                        if (data) data = JSON.parse(data);
                        else data = {internal:true};

                        callback(data);
                    } else {
                        console.log("ERROR");
                    }
                }
            };

            request.send();
            request = null;
        };

        readTincanLrsSettings(function(endpointSettings){
            var lrsClient = createLrsClient(endpointSettings);
            if (!lrsClient) return;

            var tinCanClient = new TinCan();
            tinCanClient.recordStores[0] = lrsClient;

            var statement = createStatement();
            tinCanClient.sendStatement(statement, function() {});
        });
    })();
</script>