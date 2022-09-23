(function () {
    const vscode = acquireVsCodeApi();
//for tghe other headers UI
    document.getElementById("add").addEventListener("click", () => {
        if (document.getElementById("boxContainer").childElementCount >= 2) {
            document.getElementById("boxContainer").classList.add("scrollView");
        } else if (document.getElementById("boxContainer").childElementCount <= 2) {
            document.getElementById("boxContainer").classList.remove("scrollView");
        }
        // Create a div
        var divContainer = document.createElement("div");
        divContainer.setAttribute("style", "display: flex; align-items: center; margin-bottom: 16px;");
        // Create a file input
        var file = document.createElement("input");
        file.setAttribute("type", "text");
        file.setAttribute("id", "headerName"); // You may want to change this
        file.setAttribute("style", "width: 20%; margin-right: 16px;");
        file.setAttribute('placeholder', 'Name');
        // Create a text input
        var text = document.createElement("input");
        text.setAttribute("type", "text");
        text.setAttribute("id", "headerValue"); // you may want to change this
        text.setAttribute("style", "width:70%;margin-right: 16px;");
        text.setAttribute('placeholder', 'Value');
        //add button for the delete  operation.
        var deleteButton = document.createElement("button");
        deleteButton.setAttribute("type", "button" );
        deleteButton.innerText = "Delete";
        deleteButton.setAttribute("style", "width: fit-content;margin-top: 16px;");
        deleteButton.addEventListener('click', () => {
        if (document.getElementById("boxContainer").childElementCount <= 2) {
            document.getElementById("boxContainer").classList.remove("scrollView");
        }
        document.getElementById("boxContainer").setAttribute("style","resize: horizontal;resize: vertical;");
            deleteButton.parentNode.remove();
        });
        // add the file and text to the div
        divContainer.appendChild(file);
        divContainer.appendChild(text);
        divContainer.appendChild(deleteButton);
        //Append the div to the container div
        document.getElementById("boxContainer").appendChild(divContainer);
    });

    // document. getElementById("form"). reset();

    // when code profiler button is clicked
    document.getElementById("codeProfiler").addEventListener("click", () => {
        //get file path value
        const filepath = document.getElementById("filePath").value;
        //get file name
        const fileName = document.getElementById("fileName").value;
        const codeProfvalueilerURL = document.getElementById("codeProfilerURL").value;
        //get the radio btton event_handler value
        var elements = document.getElementsByName('eventHandler');
        var eventHandlerButton;
        console.log(elements);
        elements.forEach(e => {
            if (e.checked) {
                //if radio button is checked, set sort style
                eventHandlerButton = e.value;
            }
        });
        //pragma headers
        const pragmaHeaders = undefined;// document.getElementById("pragmaHeader").value;
        var headers = new Array;
        // get the other headers values
        let index = 0;
            document.getElementById("boxContainer").childNodes.forEach((item) => {
                if(item.childNodes[0].value && item.childNodes[1].value){
                    headers[index]= [`${item.childNodes[0].value}`, `${item.childNodes[1].value}`];
                    index = index + 1;
                }
            });
        if (codeProfvalueilerURL && eventHandlerButton ) {
            vscode.postMessage({
                command: 'info',
                filePath: filepath,
                fileName: fileName,
                url: codeProfvalueilerURL,
                eventHandler: eventHandlerButton,
                pragmaHeaders: pragmaHeaders,
                otherHeaders: headers,
            });
        }
        else {
            vscode.postMessage({
                command: 'alert',
                msg: "Missing value in the required feilds"
            });
        }
    });
}());