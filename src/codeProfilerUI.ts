import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import * as codeProfiler from './codeProfilerFunction';
export class CodeProfilerTerminal implements vscode.WebviewViewProvider {

    public static readonly viewType = 'edgeworkers-vscode.fetchDataView';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [Utils.joinPath(this._extensionUri, 'media')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'info':
                    console.log(message.otherHeaders);
                    try{
                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "Running Code Profiler",
                            cancellable: false
                            }, async () => {
                            await codeProfiler.getCodeProfilerFile(message.filePath, message.fileName, message.url, message.eventHandler, message.pragmaHeaders, message.otherHeaders);
                        });
                    }catch(err:any){
                        vscode.window.showErrorMessage(err.toString());
                    }
                    return;
                case 'cancel':
                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    return;
                case 'alert':
                    vscode.window.showErrorMessage(message.msg);
                    return;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
       // Local path to main script run in the webview
       const scriptPathOnDisk = Utils.joinPath(this._extensionUri, 'media', 'codeProfiler.js');
       // And the uri we use to load this script in the webview
       const scriptUri =  webview.asWebviewUri(scriptPathOnDisk);
       console.log("scriopt uri-----------------------------------" + `${scriptUri}`);
           // Local path to css styles
       const stylesPathMainPath =  Utils.joinPath(this._extensionUri, 'media', 'style.css');
       const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet"  href="${stylesMainUri}">
</head>
<body>
<h2>EdgeWorkers Code Profiler</h2>
<div class="container">
<form id="form">
<div class="row">
    <div class="col-75">
        <p>Profile the EdgeWorker code active on the Akamai Staging network.</p>
        <p>(<span style="color:red;">*</span>)Indicates required fields</p>
    </div>
    <div class="col-25 submit-container">
        <input type="reset" value="Reset">
        <input type="button" value="Run Profiler" id="codeProfiler">
    </div>
</div>
<div class="row">
   <div class="col-25">
   <label for="URL" class="required">URL to profile </label>
   </div>
   <div class="col-75">
       <input type="text" id="codeProfilerURL" name="codeProfilerUrl"  placeholder="For example, https://www.example.com" required />
   </div>
</div>
<div class="row">
   <div class="col-25">
       <label for="eventHandler" class="required">Event handler to profile</label>
   </div>
   <div class="col-75">
       <div class="eventhandlerOptions">
           <input type="radio" id="onClientRequest" name="eventHandler" value="x-ew-code-profile-onclientrequest" required checked="checked" />
           <label for="onClientRequest">onClientRequest</label><br>
           <input type="radio" id="onOriginRequest" name="eventHandler" value="x-ew-code-profile-onoriginrequest" >
           <label for="onOriginRequest">onOriginRequest</label><br> 
           <input type="radio" id="onOriginResponse" name="eventHandler" value="x-ew-code-profile-onoriginresponse" >
           <label for="onOriginResponse">onOriginResponse</label><br>  
           <input type="radio" id="onClientResponse" name="eventHandler" value="x-ew-code-profile-onclientresponse" >
           <label for="onClientResponse">onClientResponse</label><br>  
           <input type="radio" id="responseProvider" name="eventHandler" value="x-ew-code-profile-responseprovider" >
           <label for="responseProvider">responseProvider</label><br> 
       </div> 
   </div>
</div>
<div class="row">
   <div class="col-25">
   <label for="Path">File path (optional)</label>
   </div>
   <div class="col-75">
       <input type="text" id="filePath" name="filePath"  placeholder="For example, /Users/$USERID/Downloads" />
   </div>
</div>
<div class="row">
   <div class="col-25">
   <label for="File" >File name (optional)</label>
   </div>
   <div class="col-75">
       <input type="text" id="fileName" name="fileName" />
   </div>
</div>
<!--
<div class="row">
   <div class="col-25">
   <label for="pragma">Pragma Headers </label>
   </div>
   <div class="col-75">
       <input type="text" id="pragmaHeader" value="akamai-x-cache-on,akamai-x-cache-remote-on,akamai-x-check-cacheable,akamai-x-get-true-cache-key,akamai-x-get-cache-key,akamai-x-serial-no,akamai-x-get-request-id">
   </div>
</div> -->
<div class="row">
   <div class="col-25">
       <label for="otherHeaders">Add headers</label>
   </div>
   <div class="col-75 header-container">
       <button type="button" id="add">ADD</button>
       <div></div>
       <div id="boxContainer"></div>
    </div>
</div>
</form>
</div>
<script src = "${scriptUri}">
</script>
</body>
</html>`;
};
}
