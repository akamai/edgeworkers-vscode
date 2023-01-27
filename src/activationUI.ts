/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

export function getWebviewContent(context:vscode.ExtensionContext,webview: vscode.Webview,listIds:string,versionIds:string){
    // Local path to main script run in the webview
        const scriptPathOnDisk = Utils.joinPath(context.extensionUri, 'media', 'activateEW.js');
        // And the uri we use to load this script in the webview
        const scriptUri =  webview.asWebviewUri(scriptPathOnDisk);
            // Local path to css styles
        const stylesPathMainPath =  Utils.joinPath(context.extensionUri, 'media', 'style.css');
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet"  href="${stylesMainUri}">
</head>
<body>
<h2>Activate EdgeWorker Version</h2>
<p>Enter the below details to activate version in a network</p>

<div class="container">
<form id="form">
<div class="row">
    <div class="col-25">
    <label for="lId">EdgeWorker </label>
    </div>
    <div class="col-75">
        <select id="selectId" required>
        <option value="" disable selected hidden>Select EdgeWorker</option>
        </select>
    </div>
</div>
<div class="row">
    <div class="col-25">
    <label for="lVersion">Version</label>
    </div>
<div class="col-75">
        <select id="selectVersion" required  >
        <option value="" disable selected hidden>Select Version</option>
        </select>
    <label style="padding-top :0" for="infoVersion">you can only select a version if you have permissions to activate it.</label>
    </div>
</div>
<div class="row">
    <div class="col-25">
    <label for="groupId">Network</label>
    </div>
    <div class="col-75">
        <select id="selectNet" required>
        <option value="" disable selected hidden>Select Network</option>
        <option value="staging">Staging</option>
        <option value="production">Production</option>
        </select>
    </div>
</div>
<div class="row">
<div class="col-25">
    <button id ="cancel">Cancel</button>
</div>
<div class="col-75">
    <button id ="activate">Activate Version</button>
</div>
</div>
</form>
</div>
<script >
arrayList = `+JSON.stringify(listIds)+`
arrayListVersion = `+JSON.stringify(versionIds)+`
</script>
<script src = "${scriptUri}">
</script>
</body>
</html>`;
};

