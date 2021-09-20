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

export const uploadEdgeWorker = async function(tarFilePath: string,edgeworkerID:string = ''):Promise<boolean>{
    let userEdgeWorkerID :string = edgeworkerID as string;
    const tarFileName = path.parse(tarFilePath).base;
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    try{
        if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
            userEdgeWorkerID = await edgeWorkerCommands.askUserForUserInput(textForInfoMsg.get_edgeWorker_id_User,'') as string;
            if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
                throw new Error(ErrorMessageExt.empty_edgeWorkerID);
            }
        }
        const validate = await validateEgdeWorkerID(userEdgeWorkerID,accountKey);
        if(validate === true){
            const uploadCmd = await akamiCLICalls.getUploadEdgeWorkerCmd(tarFilePath,userEdgeWorkerID,accountKey);
            const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(uploadCmd));
            const msg = textForInfoMsg.upload_edgeWorker_success+`${tarFileName}`+" to Edge Worker ID: "+`${userEdgeWorkerID}`;
            vscode.window.showInformationMessage(msg);
        }
        else{
            const msg =`${edgeworkerID} `+ErrorMessageExt.id_not_found+ErrorMessageExt.edgeWorkerId_notFound;
            throw new Error(msg);
        }
        return true;
    }catch(e:any){
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

