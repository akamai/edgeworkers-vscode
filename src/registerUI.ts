/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

export function getWebviewContent(context:vscode.ExtensionContext,webview: vscode.Webview,groupIds:string){
    // Local path to main script run in the webview
		const scriptPathOnDisk = Utils.joinPath(context.extensionUri, 'media', 'registerUI.js');
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
<h2>Register EdgeWorker </h2>
<p>Enter the below details to Register Edgeworker</p>
 
<div class="container">
<form id="form">
<div class="row">
    <div class="col-25">
    <label for="gId">Group ID </label>
    </div>
    <div class="col-75">
        <select id="groupId" required>
        <option value="" disable selected hidden>Select Group ID</option>
        </select>
    </div>
</div>
<div class="row">
    <div class="col-25">
    <label for="EWName">EdgeWorker Name</label>
    </div>
<div class="col-75">
        <input type="text" id="edgeworkerName" name="EWName" required>
</div>
</div>
<div class="row">
    <div class="col-25">
    <label for="resourceID" required>Resource Tier ID</label>
    </div>
    <div class="col-75">
        <select id="resourceId" required>
        <option value="" disable selected hidden>Select Resource Tier ID</option>
        <option value="100">Basic Compute</option>
        <option value="200">Dynamic Compute</option>
        </select>
    </div>
</div>
<div class="row">
<div class="col-25">
    <button id ="cancel">Cancel</button>
</div>
<div class="col-75">
    <button id ="register">Register EdgeWorker</button>
</div>
</div>
</form>
</div>
<script >
groupId = `+JSON.stringify(groupIds)+`
</script>
<script src = "${scriptUri}">
</script>
</body>
</html>`;
};

