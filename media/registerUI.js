(function() {

    const vscode = acquireVsCodeApi();
    const groupids= JSON.parse(groupId);
    const groupIdlist = document.getElementById("groupId"); 
    for(var i = 0; i < groupids.length; i++)
    {
        var option = document.createElement("OPTION"),
            txt = document.createTextNode(groupids[i].groupName +" || "+ groupids[i].groupId);
        option.appendChild(txt);
        option.setAttribute("value",groupids[i].groupId);
        groupIdlist.insertBefore(option,groupIdlist.lastChild);
    }
      document.getElementById("cancel").addEventListener("click",() => {
        vscode.postMessage({
            command: 'cancel',
            text: "cancelled html"
        });
    });
    document.getElementById("register").addEventListener("click",() => {
        const value1 = document.getElementById("edgeworkerName").value;
        const value2 = document.getElementById("resourceId").value;
        const value3 = groupIdlist.options[groupIdlist.selectedIndex].value;
        if(value1.length !==0 && value2.length !==0 && value3.length !==0 ){
            vscode.postMessage({
                command: 'info',
                groupId: groupIdlist.options[groupIdlist.selectedIndex].value,
                edgeworker: value1,
                resourceId: value2.toString().trim()
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