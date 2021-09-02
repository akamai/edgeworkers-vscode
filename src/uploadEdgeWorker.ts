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

export const uploadEdgeWorker = async function(tarFilePath: string):Promise<boolean>{
    let bundlePath = tarFilePath.replace('file://','');
    const tarFileName = path.parse(bundlePath).base;
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    try{
        const edgeWorkerID = await edgeWorkerCommands.askUserForUserInput(textForInfoMsg.get_edgeWorker_id_User,'');
        if(edgeWorkerID === '' || edgeWorkerID === undefined){
            throw new Error(ErrorMessageExt.empty_edgeWorkerID);
        }
        const validate = await validateEgdeWorkerID(edgeWorkerID,accountKey);
        if(validate === true){
            let edgeWorkerVersionID = await edgeWorkerCommands.askUserForUserInput(textForInfoMsg.get_edgeWorker_versionId,'');
            if(edgeWorkerVersionID === '' || edgeWorkerVersionID === undefined){
                edgeWorkerVersionID = '';
            }
            const uploadCmd = await akamiCLICalls.getUploadEdgeWorkerCmd(bundlePath,edgeWorkerID,accountKey,edgeWorkerVersionID);
            const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(uploadCmd));
            const msg = textForInfoMsg.upload_edgeWorker_success+`${tarFileName}`+" to Edge Worker ID: "+`${edgeWorkerID}`+" and version: "+`${edgeWorkerVersionID}`;
            vscode.window.showInformationMessage(msg);
        }
        else{
            const msg =`${edgeWorkerID}`+ErrorMessageExt.id_not_found+ErrorMessageExt.edgeWorkerId_notFound;
            throw new Error(msg);
        }
        return true;
    }catch(e){
        vscode.window.showErrorMessage(e.toString());
        return false;
    }
};

export const validateEgdeWorkerID = async function(edgeWorkerID: string, accountKey?:string ):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        try{
            let found:boolean=false;
            const edgeWorkerIDsString= await akamiCLICalls.callAkamaiCLIFOrEdgeWorkerIDs(accountKey);
            const edgeWorkerIDsJson = JSON.parse(edgeWorkerIDsString);
            edgeWorkerIDsJson.data.find((element:any) => {
                if(edgeWorkerID === element.edgeWorkerId.toString()){
                    found = true;
                } 
            });
            resolve(found);
        }catch(e){
            reject(e);
        }
    });
};

