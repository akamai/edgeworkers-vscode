/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as uploadEdgeWorker from './uploadEdgeWorker';
import * as akamaiCLIConfig from './cliConfigChange';
import * as akamaiCLICalls from './akamaiCLICalls';

export const uploadEdgeWorkerTarballToSandbox = async function(bundlePath:string):Promise<boolean>{
    try{
        const tarFileName = path.parse(bundlePath).base;
        const edgeworkerBundle =  tarFileName.substr(0,tarFileName.lastIndexOf('.'));
        const unTar= await akamaiCLICalls.untarTarballToTempDir(bundlePath,edgeworkerBundle);
        const edgeWorkerversion = await getVersionIdFromBundleJSON(unTar);
        akamaiCLICalls.deleteOutputFolder(unTar);
        if(edgeWorkerversion === ''){
            throw new Error(ErrorMessageExt.version_missing_bundleJSON);
        }
        const akamaiConfigcmd = await akamaiCLIConfig.checkAkamaiConfig();
        const listIdsCmd= await akamaiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
        const listIds = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
        let edgeWorkerId = await uploadEdgeWorker.quickPickItem(textForInfoMsg.get_edgeWorker_id_User,listIds).catch((e:any) => {throw new Error(`failed to Test Edgeworker in Sandbox due to :`+e.toString());});
        edgeWorkerId = edgeWorkerId.substring(edgeWorkerId.lastIndexOf('|')+2);
        if(edgeWorkerId === '' || edgeWorkerId === undefined){
            throw new Error(ErrorMessageExt.empty_edgeWorkerId);
        }
        const updateCmd = await akamaiCLICalls.updateEdgeWorkerToSandboxCmd("sandbox","update-edgeworker",bundlePath,edgeWorkerId);
        try{
            await akamaiCLICalls.executeCLICommandExceptTarCmd(await akamaiCLICalls.generateCLICommand(updateCmd));
            vscode.window.showInformationMessage(`EdgeWorker: ${edgeWorkerId} and Version: ${edgeWorkerversion} ` + textForInfoMsg.success_upload_ew_to_sandbox);
            vscode.window.showInformationMessage(textForInfoMsg.info_to_test_edgeWorker_curl,{ modal: true }); 
        }catch(e){
            let errorString = e as string;
            let errorStr = errorString.substring(errorString.indexOf('{'), errorString.indexOf('}')+1);
            if(errorStr){
                let jsonError = JSON.parse(errorStr);
                throw new Error(ErrorMessageExt.upload_ew_tosandbox_fail+jsonError.detail);
            }
            else{
                throw new Error(ErrorMessageExt.Fail_to_upload_EW_sandbox+`EdgeWorker : ${edgeWorkerId} and Version: ${edgeWorkerversion}`+'to sandbox'+ ErrorMessageExt.display_original_error+ e);
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

