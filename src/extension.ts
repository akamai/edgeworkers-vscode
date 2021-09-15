/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
const path = require('path');
import { exit } from 'process';
const cp = require('child_process');
const exec = require('child_process').exec;
const edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers';
const akamai_version_cmd = 'akamai --version';
import * as downloadEdgeWorker from './downloadEdgeWorker';
import * as uploadEdgeWorker from './uploadEdgeWorker';
import { EdgeWorkerDetails, EdgeWorkerDetailsProvider } from './managementUI';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as uploadTarBallToSandbox from './uploadTarBallToSandbox';
import console from 'console';

export const activate = function(context: vscode.ExtensionContext) {
    // management UI class initilization
    const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider();
    vscode.window.createTreeView('edgeWorkerDetails', {
         treeDataProvider: edgeWorkerDetailsProvider,
         showCollapseAll: true
     });
     //refresh the tree view in management UI
	vscode.commands.registerCommand('edgeworkers-vscode.refreshEntry', function() {
		const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider();
        vscode.window.createTreeView('edgeWorkerDetails', {
            treeDataProvider: edgeWorkerDetailsProvider,
            showCollapseAll: true
        });  
     }); 
    // command activation for creating bundle
    vscode.commands.registerCommand('edgeworkers-vscode.edgeworkerBundle', async function (bundleFileInput:any) {
        // get the parent folder for the bundle.json
        const folder = getFileParentFolderFromInput(bundleFileInput);
        await edgeWorkerCommands.createAndValidateEdgeWorker(folder);
    });

    // command activation for downloading edgeworker
    vscode.commands.registerCommand('edgeworkers-vscode.downloadEdgeWorker',  async (edgeWorkerdetails: EdgeWorkerDetails) => {
        console.log("the id id :"+ edgeWorkerdetails.version +"and version is "+ edgeWorkerdetails.label);
        await downloadEdgeWorker.downloadEdgeWorker(edgeWorkerdetails.version,edgeWorkerdetails.label);
     });

    //command for the upload EdgeWorker Tar ball
    vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorker',  async (uploadCommandInput:any)=>{
        const filePath = getFilePathFromInput(uploadCommandInput);
        await uploadEdgeWorker.uploadEdgeWorker(filePath);
     });

    //command for the upload EdgeWorker Tar ball
    vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorkerFromMangementUI',  async ()=>{
        const tarFileFSPath = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: true,
            canSelectMany: false,
            filters: {'Tarball': ['tgz', 'tar.gz']}
        });
        if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
            // there should be exactly one result
            const filePath = getFilePathFromInput(tarFileFSPath[0]);
            await uploadEdgeWorker.uploadEdgeWorker(filePath);
        }
        else{
            vscode.window.showErrorMessage("Tar file is not provided");
        }
    });

    vscode.commands.registerCommand('edgeworkers-vscode.uploadTarBallToSandBox',  async (sandboxCommandInput:any)=>{
        const filePath = getFilePathFromInput(sandboxCommandInput);
        await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(filePath);
     });
};

// this method is called when your extension is deactivated
export function deactivate() {}


function getFilePathFromInput(commandParam : any) : string {
    let filePath = '';
        
    if (typeof commandParam === "string") {
        // use as is
        filePath = commandParam;
    } else if (typeof commandParam === "object" && typeof commandParam.path === "string") {
        // input is an object but we know it has the path property which is what we want so let's use that
        // looks like this is a vscode.uri object but it's hard to tell from the debugger -- at least it looks like one
        filePath = commandParam.path;
    } else {
        // idk what this is so let's force it to be a string
        filePath = commandParam.toString();
        console.log(`WARN: unknown param type encountered for VS Code command; forcing to string as: ${path}`);
    }

    return filePath;
}

function getFileParentFolderFromInput(commandParam : any) : string {
    const filePath = getFilePathFromInput(commandParam);
    return path.dirname(filePath);
}
