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
import {validateEgdeWorkerID} from './uploadEdgeWorker';
import * as akamiCLICalls from './akamiCLICalls';

export const uploadEdgeWorkerTarballToSandbox = async function(tarFilepath:string):Promise<boolean>{
    try{
        const akamaiSandboxInstall= await akamiCLICalls.checkAkamaiSandbox(textForCmd.akamai_sandbox_version);
        const accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
        let bundlePath = tarFilepath.replace('file://','');
        const tarFileName = path.parse(bundlePath).base;
        const edgeworkerBundle =  tarFileName.substr(0,tarFileName.lastIndexOf('.'));
        const unTar= await akamiCLICalls.untarTarballToTempDir(bundlePath,edgeworkerBundle);
        const edgeWorkerversion = await getVersionIdFromBundleJSON(unTar);
        akamiCLICalls.deleteOutputFolder(unTar);
        if(edgeWorkerversion === ''){
            throw new Error(ErrorMessageExt.version_missing_bundleJSON);
        }
        const edgeWorkerID = await edgeWorkerCommands.askUserForUserInput(textForInfoMsg.get_edgeWorker_id_User,'');
        if(edgeWorkerID === '' || edgeWorkerID === undefined){
            throw new Error(ErrorMessageExt.empty_edgeWorkerID);
        }
        const updateCmd = await akamiCLICalls.updateEdgeWorkerToSandboxCmd(bundlePath,edgeWorkerID,accountKey);
        const cmdUpdate = await akamiCLICalls.generateCLICommand(updateCmd);
        try{
            const updateStatus = await akamiCLICalls.executeCLICommandExceptTarCmd(cmdUpdate);
            vscode.window.showInformationMessage(`EdgeWorker: ${edgeWorkerID} and Version: ${edgeWorkerversion} ` + textForInfoMsg.success_upload_ew_to_sandbox);
            vscode.window.showInformationMessage(textForInfoMsg.info_to_test_edgeWorker_curl,{ modal: true }); 
        }catch(e){
            const errorString = e as string;
            if(errorString.includes("Sandbox not found")){
                throw new Error(ErrorMessageExt.if_sandbox_not_started);
            }
            else{
                throw new Error(ErrorMessageExt.Fail_to_upload_EW_sandbox+`Edge Worker : ${edgeWorkerID} and Version: ${edgeWorkerversion}`+'to sandbox'+ ErrorMessageExt.display_original_error+ e);
            } 
        }
    return true;
    }catch(e){
        const err = e as string
        vscode.window.showErrorMessage(err);
        return false;
    }
};

export const getVersionIdFromBundleJSON = async function(untarPath:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        let edgeWorkerVersion:string = '';
        const jsonFilePath = `${untarPath}/bundle.json`;
        let  data = fs.readFileSync(jsonFilePath,'utf8');
        const jsonData = JSON.parse(data);
        if(jsonData["edgeworker-version"]!== undefined){
            edgeWorkerVersion = jsonData["edgeworker-version"]; 
        }
        resolve(edgeWorkerVersion);
    });
};

