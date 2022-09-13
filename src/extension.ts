/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import * as downloadEdgeWorker from './downloadEdgeWorker';
import * as uploadEdgeWorker from './uploadEdgeWorker';
import { EdgeWorkerDetails, EdgeWorkerDetailsProvider,getListArrayOfEdgeWorker } from './managementUI';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
import * as managementUI from './managementUI';
import * as uploadTarBallToSandbox from './uploadTarBallToSandbox';
import * as akamaiCLIConfig from './cliConfigChange';
import * as codeProfiler from './codeProfilerFunction';
import {CodeProfilerTerminal} from './codeProfilerUI';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import { Utils } from 'vscode-uri';
import { hostname } from 'os';

import { off } from 'process';
import * as activationUI from './activationUI';
import * as registerUI from './registerUI';
import console from 'console';
import { throws } from 'assert';
const path = require('path');
const os = require('os');
const fs = require('fs');

export const activate = async function(context: vscode.ExtensionContext){
    akamiCLICalls.checkEnvBeforeEachCommand()
    .then(async ()=> { 
        const provider = new CodeProfilerTerminal(context.extensionUri);
        context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CodeProfilerTerminal.viewType, provider));
    }).catch((err:any)=> {
        vscode.window.showErrorMessage(err.toString());
    });
    // management UI class initilization
    await akamaiCLIConfig.setAkamaiCLIConfig();
    akamiCLICalls.checkEnvBeforeEachCommand()
    .then(async ()=> { 
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gathering EdgeWorker Details",
            cancellable: true
            }, async (progress, token) => {
            token.onCancellationRequested(() => {
                console.log("User canceled the long running operation");
            });
            const listIdsAndVersion = await managementUI.getListIdsAndVersions();
            const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider(listIdsAndVersion);
            vscode.window.createTreeView('edgeWorkerDetails', {
                treeDataProvider: edgeWorkerDetailsProvider,
                showCollapseAll: true
            });
            });
    }).catch((err:any)=> {
        vscode.window.showErrorMessage(err.toString());
        const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider('');
            vscode.window.createTreeView('edgeWorkerDetails', {
                treeDataProvider: edgeWorkerDetailsProvider,
                showCollapseAll: true
            });
    });
        
    //refresh the tree view in management UI
    context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.refreshEntry', async function() {
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {     
        await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Refreshing EdgeWorker Details",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                const listIdsAndVersion = await managementUI.getListIdsAndVersions();
                const edgeWorkerDetailsProvider = new EdgeWorkerDetailsProvider(listIdsAndVersion);
                vscode.window.createTreeView('edgeWorkerDetails', {
                    treeDataProvider: edgeWorkerDetailsProvider,
                    showCollapseAll: true
                });  
                });
        })
        .catch((err:any)=> {
            vscode.window.showErrorMessage(err.toString());
        });
    }));

    // command activation for creating bundle
    context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.edgeworkerBundle', async function (uri:any) {
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {     
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creating and validating the Bundle",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                let creatBundleFilePath = "";
                if(uri === undefined || uri === null || uri === ''){
                    const folderFSPath = await vscode.window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        openLabel: 'select folder with bundle files',
                    });
                    if(folderFSPath !== undefined && folderFSPath.length >0){
                        creatBundleFilePath = getFilePathFromInput(folderFSPath[0]);
                        await edgeWorkerCommands.createAndValidateEdgeWorker(creatBundleFilePath);
                    }
                    else{
                        vscode.window.showErrorMessage("Error:Folder with bundle files is not provided");
                    }
                }
                else{
                    creatBundleFilePath = getFilePathFromInput(uri);
                    const bundleFileInput = path.join(creatBundleFilePath,'..');
                    await edgeWorkerCommands.createAndValidateEdgeWorker(bundleFileInput);
                }
            });
        })
        .catch((err:any)=> {
            vscode.window.showErrorMessage(err.toString());
        });
    }));

    // command activation for downloading edgeworker
    context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.downloadEdgeWorker',  async (edgeWorkerdetails: EdgeWorkerDetails) => {
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Downloading EdgeWorker Bundle",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                if(edgeWorkerdetails.label !== 'No Versions'){
                    console.log("the id id :"+ edgeWorkerdetails.version +"and version is "+ edgeWorkerdetails.label);
                    await downloadEdgeWorker.downloadEdgeWorker(edgeWorkerdetails.version,edgeWorkerdetails.label);
                }
                else{
                    vscode.window.showErrorMessage("No EdgeWorker versions are available to download");
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err.toString());
        });
    }));
    //command for the upload EdgeWorker Tar ball file in file explorer
    context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorker',  async (uploadCommandInput:any)=>{
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Uploading EdgeWorker",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                let filePath = '';
                if(uploadCommandInput === undefined || uploadCommandInput === null || uploadCommandInput === ''){
                    const tarFileFSPath = await vscode.window.showOpenDialog({
                        canSelectFolders: false,
                        canSelectFiles: true,
                        filters: {'Tarball': ['tgz', 'tar.gz']},
                        openLabel: 'Select tar file to upload EdgeWorker Version',
                    });
                    if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
                        filePath = getFilePathFromInput(tarFileFSPath[0]);
                        await uploadEdgeWorker.uploadEdgeWorker(filePath,'');
                    }
                    else{
                        vscode.window.showErrorMessage("Error:Tar file is not provided to upload edgeworker version");
                    }
                }
                else{
                    filePath = getFilePathFromInput(uploadCommandInput);
                    await uploadEdgeWorker.uploadEdgeWorker(filePath,'');
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err.toString());
        });
    }));

    //command for the upload EdgeWorker Tar ball from mangement UI add button
    context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.uploadEdgeWorkerFromMangementUI',  async (edgeWorkerdetails: EdgeWorkerDetails)=>{
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Uploading EdgeWorker",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                const tarFileFSPath = await vscode.window.showOpenDialog({
                    canSelectFolders: false,
                    canSelectFiles: true,
                    canSelectMany: false,
                    filters: {'Tarball': ['tgz', 'tar.gz']},
                    openLabel: 'select the tar file to upload edgeworker',
                });
                if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
                    // there should be exactly one result
                    const filePath = getFilePathFromInput(tarFileFSPath[0]);
                    await uploadEdgeWorker.uploadEdgeWorker(filePath, edgeWorkerdetails.version.toString());
                }
                else{
                    vscode.window.showErrorMessage("Error: Tar file is not provided to upload edgeworker version");
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err.toString());
        });
    }));

   context.subscriptions.push(vscode.commands.registerCommand('edgeworkers-vscode.uploadTarBallToSandBox',  async (sandboxCommandInput:any)=>{
        akamiCLICalls.checkAkamaiSandbox()
        .then(async ()=> {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Uploading TarBall to SandBox",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                let filePathSandbox = '';
                if(sandboxCommandInput === undefined || sandboxCommandInput === null || sandboxCommandInput === ''){
                    const tarFileFSPath = await vscode.window.showOpenDialog({
                        canSelectFolders: false,
                        canSelectFiles: true,
                        filters: {'Tarball': ['tgz', 'tar.gz']},
                        openLabel: 'Select tar file to upload EdgeWorker to sandbox',
                    });
                    if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
                        filePathSandbox = getFilePathFromInput(tarFileFSPath[0]);
                        await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(filePathSandbox);
                    }
                    else{
                        vscode.window.showErrorMessage("Tar file is not provided to upload edgeworker version to sandbox");
                    }
                }
                else{
                    filePathSandbox = getFilePathFromInput(sandboxCommandInput);
                    await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(filePathSandbox);
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage(err.toString());
        });
    }));

    //Activation UI for edgeworker
    context.subscriptions.push(vscode.commands.registerCommand("edgeworkers-vscode.activateEdgeWorker", async function() {
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Opening Activation EdgeWorker Window",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                try{
                    const listIds = await managementUI.getListIds();
                    if(listIds !== ""){
                        const versions = await managementUI.getListIdsAndVersions();
                        const panel = vscode.window.createWebviewPanel(
                            'Activate EdgeWorker',
                            'Activate EdgeWorker',
                            vscode.ViewColumn.One,
                            {
                                enableScripts: true,
                                localResourceRoots: [Utils.joinPath(context.extensionUri, 'media')]
                            }
                        );
                        panel.webview.html = activationUI.getWebviewContent(context,panel.webview,listIds,versions);
                        // Handle messages from the webview
                        panel.webview.onDidReceiveMessage(
                            async message => {
                                switch (message.command) {
                                    case 'info':
                                    const msg = getActivationOutput(message.edgeWorker.toString(),message.network.toString(),message.version.toString());
                                    return;
                                    case 'cancel':
                                    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                                    return;
                                }
                            },
                            undefined,
                            context.subscriptions
                        );
                    }
                }catch(err:any){
                    vscode.window.showErrorMessage("Failed to open activation window due : "+err.toString());
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage("Failed to open activation window due : "+err.toString());
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("edgeworkers-vscode.registerEdgeWorker", async function() {
        akamiCLICalls.checkEnvBeforeEachCommand()
        .then(async ()=> {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Opening Registration EdgeWorker Window",
                cancellable: true
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
               
                try{
                    const groupIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-groups",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
                    const groupIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(groupIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
                    const panel = vscode.window.createWebviewPanel(
                        'Register EdgeWorker',
                        'Register EdgeWorker',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            localResourceRoots: [Utils.joinPath(context.extensionUri, 'media')]
                        }
                    );
                    panel.webview.html = registerUI.getWebviewContent(context,panel.webview,groupIds);
                    // Handle messages from the webview
                    panel.webview.onDidReceiveMessage(
                        async message => {
                            switch (message.command) {
                                case 'info':
                                const msg = getRegisterEWOutput(message.groupId.toString(),message.edgeworker.toString(),message.resourceId.toString());
                                return;
                                case 'cancel':
                                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                                return;
                                case 'alert':
                                vscode.window.showErrorMessage(message.text);
                                return;
                            }
                        },
                        undefined,
                        context.subscriptions
                    );
                }catch(e:any){
                    vscode.window.showErrorMessage("Failed to open Registration page due to "+ e.toString());
                }
            });
        })
        .catch((err:any)=>{
            vscode.window.showErrorMessage("Failed to open Registration page due to "+ err.toString());
        });
    }));
};

// this method is called when your extension is deactivated
export function deactivate() {}


export function getFilePathFromInput(commandParam : any) : string {
    let filePath = '';

    if (typeof commandParam === "string") {
        // use as is
        filePath = commandParam;
    } else if (typeof commandParam === "object" && typeof commandParam.path === "string") {
        // input is an object but we know it has the path property which is what we want so let's use that
        // looks like this is a vscode.uri object but it's hard to tell from the debugger -- at least it looks like one
        filePath=  commandParam.fsPath;
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


export const getActivationOutput =  async function(edgeWorker:string,network:string,version:string):Promise<string>{
    if(version === "No Versions"){
        const msg = "Cannot activate edgeworker id: "+ edgeWorker+" due to no versions for this edgeworker";
        vscode.window.showErrorMessage(msg);
        return(msg);
    }
    else{
        let msg ="Activating Edgeowrker ID:"+edgeWorker+" in network "+network + " for version "+version + " failed";
        try{
            const cmd = await akamiCLICalls.getEdgeWorkerActivationCmd("edgeworkers","activate",edgeWorker,network,version,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
            const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"msg");
            msg = status;
            vscode.window.showInformationMessage(msg);
            return(msg);
        }catch(e:any){
            vscode.window.showErrorMessage(msg+" because of "+e.toString());
            return(msg);
        }
    }
};
export const getRegisterEWOutput =  async function(groupId:string,ewName:string,resourceId:string):Promise<string>{
    let msg ="Error Registering Edgeowrker:"+ewName+" for Group ID"+groupId + " for resource Tier ID"+resourceId +" failed";
    try{
        const cmd = await akamiCLICalls.getEdgeWorkerRegisterCmd("edgeworkers","register",resourceId,groupId,ewName,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
        const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"msg");
        msg = status+ewName+" for groupID: "+groupId+" and for resource ID: "+resourceId;
        vscode.window.showInformationMessage(msg);
        return(msg);
    }catch(e:any){
        vscode.window.showErrorMessage(msg+" because of "+e.toString());
        return(msg);
    }
};


