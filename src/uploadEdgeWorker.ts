/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
const fs = require('fs');
const os = require('os');
const path = require('path');

export const uploadEdgeWorker = async function(tarFilePath: string,edgeworkerID:string = ''):Promise<boolean>{
    let userEdgeWorkerID :string = edgeworkerID as string;
    const tarFileName = path.parse(tarFilePath).base;
    const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
    const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
    try{
        if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
        userEdgeWorkerID = await quickPickItem("Select Edge Worker ID",listIds);
            userEdgeWorkerID = userEdgeWorkerID.substring(userEdgeWorkerID.lastIndexOf('|')+2);
            if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
                throw new Error(ErrorMessageExt.empty_edgeWorkerID);
            }
        }
        const validate = await validateEgdeWorkerID(userEdgeWorkerID);
        if(validate === true){
            const uploadCmd = await akamiCLICalls.getUploadEdgeWorkerCmd("edgeworkers","upload",tarFilePath,userEdgeWorkerID,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
            const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(uploadCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"msg");
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

export const validateEgdeWorkerID = async function(edgeWorkerID: string):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        try{
            let found:boolean=false;
            const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
            const edgeWorkerIDsString= await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
            const edgeWorkerIDsJson = JSON.parse(edgeWorkerIDsString);
            edgeWorkerIDsJson.find((element:any) => {
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
export const quickPickItem = async function quickPickItem(displayTxt:string,listIds: string): Promise<string> {
    const listIdsJson = JSON.parse(listIds);
    const options = listIdsJson.map((item: any) => ({ label: `${item.name} || ${item.edgeWorkerId}`}));

    return new Promise((resolve, _) => {
        const quickPick = vscode.window.createQuickPick();
        const placeholder = displayTxt;
        quickPick.placeholder = placeholder;
        quickPick.items = options;
        quickPick.canSelectMany = false;
        let selectedItems = '';
        quickPick.onDidChangeSelection((selected) => {
            selectedItems = selected[0].label.toString(); // string[]
        });
        quickPick.onDidAccept(_ => {
            // workaround for no activeItems when canSelectMany is true
            resolve(selectedItems);
            quickPick.hide();
        });
        quickPick.onDidHide(_ => quickPick.dispose());
        quickPick.show();
    });
};

