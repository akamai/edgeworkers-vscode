/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
const fs = require('fs');
const os = require('os');
const ostype = os.type();
const path = require('path');
import { ErrorMessage } from './openAPI/utils/http-error-message';
const cp = require('child_process');
const exec = require('child_process').exec;
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import {getFilePathFromInput} from './extension';
import * as akamiCLICalls from './akamiCLICalls';

export const downloadEdgeWorker = async function(edgeworkerID: string, edgeworkerVersion:string):Promise<boolean>{
    try{
        let tarFilePath = os.tmpdir();
        let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
        const tarFileFSPath = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
        });
        if(tarFileFSPath !== undefined && tarFileFSPath.length >0){
             tarFilePath= getFilePathFromInput(tarFileFSPath[0]);
        }
        const cmd = await akamiCLICalls.getEdgeWorkerDownloadCmd(edgeworkerID,edgeworkerVersion,tarFilePath,accountKey);
        const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmd));
        const tarFile = await status.substring(status.indexOf('@') + 1);
        const tarFileName = path.parse(tarFile).base;
        const edgeworkerBundle =  tarFileName.substr(0,tarFileName.lastIndexOf('.'));
        const bundlePath = path.resolve(tarFilePath,edgeworkerBundle);
        const statusUntar = await akamiCLICalls.executeCLICommandExceptTarCmd(`cd  ${tarFilePath} && mkdir ${edgeworkerBundle} && cd  ${bundlePath} && tar --extract --file ${tarFile}`);
        vscode.window.showInformationMessage(`${textForInfoMsg.tar_download_success} id: ${edgeworkerID} version: ${edgeworkerVersion} at: ${bundlePath}`);
        return(true);
    }catch(e){
        vscode.window.showErrorMessage(ErrorMessageExt.bundle_download_fail+' '+ `${edgeworkerID}`+' '+ `${edgeworkerVersion}`+" "+ErrorMessageExt.display_original_error+e);
        return(false);
    }
};


