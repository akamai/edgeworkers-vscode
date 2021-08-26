/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
const fs = require('fs');
const path = require('path');
import { ErrorMessage } from './openAPI/utils/http-error-message';
const cp = require('child_process');
const exec = require('child_process').exec;
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';

export const downloadEdgeWorker = async function(edgeworkerID: string, edgeworkerVersion:string):Promise<boolean>{
    try{
        let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
        const tarFileFSPath = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
        });
        let tarFilePath= tarFileFSPath?.toString();
        if( tarFilePath === '' || tarFilePath === undefined){
            tarFilePath = '/tmp';
        }
        else{
            tarFilePath = tarFilePath.replace('file://','');
        }
        const cmd = await akamiCLICalls.getEdgeWorkerDownloadCmd(edgeworkerID,edgeworkerVersion,tarFilePath,accountKey);
        const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmd));
        const tarFile = await status.substring(status.indexOf('@') + 1);
        const tarFileName = path.parse(tarFile).base;
        const edgeworkerBundle =  tarFileName.substr(0,tarFileName.lastIndexOf('.'));
        const statusUntar = await akamiCLICalls.executeCLICommandExceptTarCmd(`cd  ${tarFilePath} && mkdir ${edgeworkerBundle} && cd  ${tarFilePath}/${edgeworkerBundle}  && tar --extract --file ${tarFile}`);
        vscode.window.showInformationMessage(`${textForInfoMsg.tar_download_success} id: ${edgeworkerID} version: ${edgeworkerVersion} at: ${tarFilePath}/${edgeworkerBundle}`);
        return(true);
    }catch(e){
        vscode.window.showErrorMessage(ErrorMessageExt.bundle_download_fail+' '+ `${edgeworkerID}`+' '+ `${edgeworkerVersion}`+" "+ErrorMessageExt.display_original_error+e);
        return(false);
    }
};

export const askUserForTarFilePath = async function(promptName: string):Promise<string|undefined>{
    return new Promise(async (resolve, reject) => {
        let options : vscode.InputBoxOptions = {};
        let filePath:string = '/tmp';
        options.prompt = promptName;
        await vscode.window.showInputBox(options).then(value=> {
            if(value === '' || value === undefined){
                resolve(filePath);
            }
            else{
                if (fs.existsSync(value)) {
                    resolve(value);
                }
                else{
                    reject(` ${value} file path does not exists in the file system`);
                }
            }
        });
    });
};

