/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
const fs = require('fs');
const os = require('os');
const path = require('path');
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as uploadEdgeWorker from './uploadEdgeWorker';
import * as akamiCLICalls from './akamiCLICalls';

export const uploadEdgeWorkerTarballToSandbox = async function(bundlePath:string):Promise<boolean>{
    try{
        const tarFileName = path.parse(bundlePath).base;
        const edgeworkerBundle =  tarFileName.substr(0,tarFileName.lastIndexOf('.'));
        const unTar= await akamiCLICalls.untarTarballToTempDir(bundlePath,edgeworkerBundle);
        const edgeWorkerversion = await getVersionIdFromBundleJSON(unTar);
        akamiCLICalls.deleteOutputFolder(unTar);
        if(edgeWorkerversion === ''){
            throw new Error(ErrorMessageExt.version_missing_bundleJSON);
        }
        const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
        const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
        let edgeWorkerID = await uploadEdgeWorker.quickPickItem(textForInfoMsg.get_edgeWorker_id_User,listIds).catch((e:any) => {throw new Error(`failed to Test Edgeworker in Sandbox due to :`+e.toString());});
        edgeWorkerID = edgeWorkerID.substring(edgeWorkerID.lastIndexOf('|')+2);
        if(edgeWorkerID === '' || edgeWorkerID === undefined){
            throw new Error(ErrorMessageExt.empty_edgeWorkerID);
        }
        const updateCmd = await akamiCLICalls.updateEdgeWorkerToSandboxCmd("sandbox","update-edgeworker",bundlePath,edgeWorkerID);
        try{
            await akamiCLICalls.executeCLICommandExceptTarCmd(await akamiCLICalls.generateCLICommand(updateCmd));
            vscode.window.showInformationMessage(`EdgeWorker: ${edgeWorkerID} and Version: ${edgeWorkerversion} ` + textForInfoMsg.success_upload_ew_to_sandbox);
            vscode.window.showInformationMessage(textForInfoMsg.info_to_test_edgeWorker_curl,{ modal: true }); 
        }catch(e){
            let errorString = e as string;
            let errorStr = errorString.substring(errorString.indexOf('{'), errorString.indexOf('}')+1);
            if(errorStr){
                let jsonError = JSON.parse(errorStr);
                throw new Error(ErrorMessageExt.upload_ew_tosandbox_fail+jsonError.detail);
            }
            else{
                throw new Error(ErrorMessageExt.Fail_to_upload_EW_sandbox+`EdgeWorker : ${edgeWorkerID} and Version: ${edgeWorkerversion}`+'to sandbox'+ ErrorMessageExt.display_original_error+ e);
            } 
        }
    return true;
    }catch(e:any){
        vscode.window.showErrorMessage("Failed to Upload Edgeworker to Sandbox due to "+ e.toString());
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

