/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import { PlatformPath } from 'path';
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
	const refresh= vscode.commands.registerCommand('edgeworkers-vscode.refreshEntry', function() {
		const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider();
        vscode.window.createTreeView('edgeWorkerDetails', {
            treeDataProvider: edgeWorkerDetailsProvider,
            showCollapseAll: true
        });  
     }); 
    // command activation for creating bundle
    let disposable = vscode.commands.registerCommand('edgeworkers-vscode.edgeworkerBundle', async function () {
        if(vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders !== null){
            const  work_space_folder = vscode.workspace.workspaceFolders[0].uri.path;
            await edgeWorkerCommands.createAndValidateEdgeWorker(work_space_folder);
        }
        else{
            let message = "EdgeWorkers Extension: Working folder not found, open a folder an try again" ;
            vscode.window.showErrorMessage(message);
        }
    });
    // command activation for downloading edgeworker
    let download = vscode.commands.registerCommand('edgeworkers-vscode.downloadEdgeWorker',  async (edgeWorkerdetails: EdgeWorkerDetails) => {
        console.log("the id id :"+ edgeWorkerdetails.version +"and version is "+ edgeWorkerdetails.label);
        await downloadEdgeWorker.downloadEdgeWorker(edgeWorkerdetails.version,edgeWorkerdetails.label);
     });

    //command for the upload EdgWorker Tar ball
    let uploadWithTarPath = vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorker',  async (tarFilepath:string)=>{
        await uploadEdgeWorker.uploadEdgeWorker(tarFilepath.toString());
     });
    //command for the upload EdgWorker Tar ball
    let uploadWithoutTarPath = vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorkerFromMangementUI',  async (tarFilepath:string)=>{
        const tarFileFSPath = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: true,
        });
        if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
                const tarFilePath= tarFileFSPath.toString();
                await uploadEdgeWorker.uploadEdgeWorker(tarFilePath.toString());
        }
        else{
            vscode.window.showErrorMessage("Tar file is not provided");
        }
    });
    let uploadTarballToSandbox = vscode.commands.registerCommand('edgeworkers-vscode.uploadTarBallToSandBox',  async (tarFilepath:string)=>{
        await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(tarFilepath.toString());
     });
};
// this method is called when your extension is deactivated
export function deactivate() {}






