(function() {

    const vscode = acquireVsCodeApi();
    const arrVersions= JSON.parse(arrayList);
    const listVersion= JSON.parse(arrayListVersion);
    const selectListid = document.getElementById("selectId"); 
    for(var i = 0; i < arrVersions.length; i++)
    {
        var option = document.createElement("OPTION"),
            txt = document.createTextNode(arrVersions[i].name+" || "+ arrVersions[i].edgeWorkerId);
        option.appendChild(txt);
        option.setAttribute("value",arrVersions[i].edgeWorkerId);
        selectListid.insertBefore(option,selectListid.lastChild);
    }
    document.getElementById("selectId").addEventListener('change', function(event) {
    const value1 = document.getElementById("selectId").value;
    if(value1.length === 0){
        document.getElementById("selectVersion").innerHTML = "<option></option>";
    }
    else{
        var catOptions = "";
        for(var j = 0; j < listVersion.length; j++){
            if(listVersion[j].edgeWorkerId == value1){
                    listVersion[j].versions.forEach((element) => {
                        if(element["version"] === undefined || element["version"] === ''|| element["version"]=== null)
                        {
                            catOptions += "<option>" +"No Versions"+"</option>";
                        }
                        else{
                            catOptions += "<option>" +  element["version"] + "</option>";
                        }
                        
                    });
                }
        }
        document.getElementById("selectVersion").innerHTML = catOptions;
    }
    });
    document.getElementById("cancel").addEventListener("click",() => {
        vscode.postMessage({
            command: 'cancel',
            text: "cancelled html"
        });
    });
    document.getElementById("activate").addEventListener("click",() => {
        const value1 = document.getElementById("selectVersion").value;
        const value2 = selectListid.options[selectListid.selectedIndex].value;
        const value3 = document.getElementById("selectNet").value;
        if(value1.length !==0 && value2.length !==0 && value3.length !==0 ){
            vscode.postMessage({
                command: 'info',
                edgeWorker: value2,
                version: value1,
                network: value3,
            });
        }
        else{
            vscode.postMessage({
                command: 'alert',
                text:"Missing value in the requiered feild"
            });
        }
    });
}());