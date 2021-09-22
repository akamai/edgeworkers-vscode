(function() {

    const vscode = acquireVsCodeApi();
    var mealsByCategory = {
        3654: ["Soup", "Juice", "Tea", "Others"]
    }
    const arrVersions= JSON.parse(arrayList);
    const listVersion= JSON.parse(arrayListVersion);
    var selectListid = document.getElementById("selectId"); 
    for(var i = 0; i < arrVersions.data.length; i++)
    {
        var option = document.createElement("OPTION"),
            txt = document.createTextNode(arrVersions.data[i].name+" || "+ arrVersions.data[i].edgeWorkerId);
        option.appendChild(txt);
        option.setAttribute("value",arrVersions.data[i].edgeWorkerId);
        selectListid.insertBefore(option,selectListid.lastChild);
    }
    document.getElementById("selectId").addEventListener('change', function(event) {
        const value1 = document.getElementById("selectId").value;
        console.log('You selected: ' + value1);
        if(value1.length === 0){
            document.getElementById("selectVersion").innerHTML = "<option></option>";
        }
        else{
                var catOptions = "";
                for(var j = 0; j < listVersion.data.length; j++){
                    if(listVersion.data[j].edgeWorkerId == value1){
                        console.log('edgeworker id: ' + listVersion.data[j].edgeWorkerId );
                            listVersion.data[j].versions.forEach((element) => {
                                console.log('version: ' + element.version);
                                catOptions += "<option>" +  element.version + "</option>";
                            });
                        }
                }
               
                // for (categoryId in mealsByCategory[value1]) {
                //     catOptions += "<option>" + mealsByCategory[value1][categoryId] + "</option>";
                // }
                document.getElementById("selectVersion").innerHTML = catOptions;
        }
      });
    // var versionIds = '${versionIds}';
    // var arrayToUseVersion = versionIds.split(',');
    // var selectVersionId = document.getElementById("selectVersion").onchange(),
    //                 arrVersions = arrayList;
    // for(var i = 0; i < arrVersions.length; i++)
    // {
    //     var option = document.createElement("OPTION"),
    //         txt = document.createTextNode(arrVersions[i]);
    //     option.appendChild(txt);
    //     option.setAttribute("value",arrVersions[i]);
    //     selectVersionId.insertBefore(option,selectVersionId.lastChild);
    // }
      document.getElementById("cancel").addEventListener("click",() => {
        vscode.postMessage({
            command: 'cancel',
            text: "cancelled html"
        });
    });
    document.getElementById("activate").addEventListener("click",() => {
        var edgeWorkerIds = document.getElementById("selectId");
        var  value = edgeWorkerIds.options[edgeWorkerIds.selectedIndex].value;
        var versionId = document.getElementById("selectVersion").value;
        var networkValue = document.getElementById("selectNet").value;
        vscode.postMessage({
            command: 'info',
            edgeWorker: value,
            version: versionId,
            network: networkValue,
        });
    });
}());