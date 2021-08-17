/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
// import { DepNodeProvider } from './nodeDependencies';
import { PlatformPath } from 'path';
import { exit } from 'process';
const cp = require('child_process');
const exec = require('child_process').exec;
const edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers';
const akamai_version_cmd = 'akamai --version';
import { EdgeWorkerDetailsProvider } from './managementUI';
import * as edgeWorkerCommands from './edgeWorkerCommands';

export const activate = function(context: vscode.ExtensionContext) {
    // management UI class initilization
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    const nodeDependenciesProvider = new EdgeWorkerDetailsProvider(`${accountKey}`);
    vscode.window.createTreeView('nodeDependencies', {
         treeDataProvider: nodeDependenciesProvider,
         showCollapseAll: true
     });
     // vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	 vscode.commands.registerCommand('nodeDependencies.refreshEntry', function() {
         // get the aqccount key  and otyher configuration vaues
        let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
		const nodeDependenciesProviderRefresh = new EdgeWorkerDetailsProvider(`${accountKey}`);
        vscode.window.createTreeView('nodeDependencies', {
            treeDataProvider: nodeDependenciesProviderRefresh,
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
            let message = "YOUR-EXTENSION: Working folder not found, open a folder an try again" ;
            vscode.window.showErrorMessage(message);
        }
    });
};
// this method is called when your extension is deactivated
export function deactivate() {}






