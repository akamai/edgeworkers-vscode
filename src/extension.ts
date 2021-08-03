/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
import * as edgeWorkersClientSvc from './openAPI/edgeActions/client-manager';
import * as edgeWorkersSvc from './openAPI/edgeActions/ew-service';
import { rejects } from 'assert';
import { Console } from 'console';
import * as vscode from 'vscode';
import {
    ConfigurationTarget,
    workspace
  }
  from 'vscode';
import { DepNodeProvider } from './nodeDependencies';
const { spawn } = require('child_process');
const cp = require('child_process');
const edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers';
const akamai_version_cmd = 'akamai --version';

export function activate(context: vscode.ExtensionContext) {

    // management UI class initilization
    let accountKey = getAccountKey();
    const nodeDependenciesProvider = new DepNodeProvider(`${accountKey}`);
    vscode.window.createTreeView('nodeDependencies', {
         treeDataProvider: nodeDependenciesProvider,
         showCollapseAll: true
     });
     // vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	 vscode.commands.registerCommand('nodeDependencies.refreshEntry', function() {
         // get the aqccount key  and otyher configuration vaues
        let accountKey = getAccountKey();
		const nodeDependenciesProviderRefresh = new DepNodeProvider(`${accountKey}`);
        vscode.window.createTreeView('nodeDependencies', {
            treeDataProvider: nodeDependenciesProviderRefresh,
            showCollapseAll: true
        });  
     });

 // command activation for creating bundle
    let disposable = vscode.commands.registerCommand('edgeworkers-vscode.edgeworkerBundle', function () {
        // run akamai --version command in cmd to check if akami CLI is installed
        cp.exec(akamai_version_cmd, async (err: string, stdout: string, stderr: string) => {            
            if (err) {
                console.log(err);
                const resp = await vscode.window.showErrorMessage(
                    'Akamai CLI is not installed. Do you want to install Akamai CLI ?',
                    'Install'
                  );
                  if (resp === 'Install') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(edgeworker_download_URI));
                    // vscode.env.openExternal(vscode.Uri.parse(edgeworker_download_URI));
                  }
            }
            else if(stderr){
                console.log('Stderr: ' + stderr);
            }
            else{
                console.log('Stdout: ' + stdout);
                // check if the bundle.json is present in the workspace
                let check_File = await checkFile('**/bundle.json');
                if(check_File === false){
                    const msg = vscode.window.showErrorMessage(
                        'Create edge worker bundle failed! Bundle.json not found in workspace'
                    );
                }
                else{
                    const msg = vscode.window.showInformationMessage(
                        'Bundle.json file found'
                    );
                    //create edge worker bundle
                    createEdgeWorkerBundle();
                }
            }
        });

    });
}
export function checkFile(fileName: string){
    return vscode.workspace.findFiles(`${fileName}`).then(files => { 
     if(files.length < 1 || files === undefined ){
         return false;
     }
          else
          {return true;}
     });
 }
export async function createEdgeWorkerBundle(){    
    let options : vscode.InputBoxOptions = {};
    options.prompt = "Enter edge worker bundle name";
    const terminal = vscode.window.createTerminal("Akamai CLI");
    vscode.window.showInputBox(options).then(async value => {
        var work_space_folder:string | undefined;
        if(vscode.workspace.workspaceFolders !== undefined){
           const  work_space_folder = vscode.workspace.workspaceFolders[0].uri.path;
            //check if a tar is already present in the workspace folder
            console.log("checking the tar file");
            let tarFileName = `**/${value}.tgz`;
            console.log(`checking the tar file ${tarFileName}`);
            let check_Tar = await checkFile(tarFileName);
            if(check_Tar === true){
                console.log("tar found");
                const resp = vscode.window.showErrorMessage(
                    `${value}.tgz already exists. Dou you want to create another .tgz file?`,
                    ...['yes','no']
                  );
                if(await resp === 'yes'){
                    let options : vscode.InputBoxOptions = {};
                    options.prompt = "Enter edge worker bundle name";
                    vscode.window.showInputBox(options).then(bundle => {
                        //create tar 
                     createTar(terminal, bundle, work_space_folder);
                     //validate tar using akamai CLI
                     validateTar(terminal, bundle, work_space_folder);

                    });
                }
                else{
                    validateTar(terminal, value, work_space_folder);
                }
            }
            else{
                //create tar 
                createTar(terminal, value, work_space_folder);
                //validate tar using akamai CLI
                validateTar(terminal, value, work_space_folder);
            }
        }
        else {
            let message = "YOUR-EXTENSION: Working folder not found, open a folder an try again" ;
            vscode.window.showErrorMessage(message);
        }
    });
}
export function validateTar(terminal:vscode.Terminal, value: string | undefined, work_space_folder: string){
    vscode.workspace.createFileSystemWatcher("**/*.tgz").onDidCreate(file => {
        console.log(`tar file ${value}.tgz is created now at ${file}`);
        let accountKey = getAccountKey();
        let sectionName= getSectionName();
        if (accountKey !== ''){
            terminal.sendText(`akamai edgeworkers validate ${work_space_folder}/${value}.tgz --accountkey ${accountKey}`);
        }
        else{
            terminal.sendText(`akamai edgeworkers validate ${work_space_folder}/${value}.tgz `);
        }
        console.log(`section name is : ${sectionName} and the account key is ${accountKey}`);
        terminal.show();
        });
}
export function createTar(terminal:vscode.Terminal,value: string | undefined,work_space_folder: string){    
    let tar = `tar --disable-copyfile -czvf ${value}.tgz *`;
    terminal.sendText(`cd ${work_space_folder}`);
    terminal.sendText(tar);
    terminal.show();
}
export function getAccountKey():string{
    try{
        let accountKey: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('accountKey');
        console.log(`account key ${accountKey}`);
        return(accountKey);
    }catch(e){
        return(e);
    }
}
export function getSectionName():string | undefined{
    let sectionName: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('sectionName');
    console.log(`section name ${sectionName}`);
    return(sectionName);
 }

// this method is called when your extension is deactivated
export function deactivate() {}






