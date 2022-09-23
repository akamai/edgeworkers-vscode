/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
import * as akamaiCLIConfig from './cliConfigChange';
import * as os from 'os';
import * as path from 'path';

export const uploadEdgeWorker = async function(tarFilePath: string,edgeworkerID:string):Promise<boolean>{
    let userEdgeWorkerID :string = edgeworkerID;
    const tarFileName = path.parse(tarFilePath).base;
    try{
<<<<<<< HEAD
        const akamaiConfigcmd = await akamaiCLIConfig.checkAkamaiConfig();
        const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"),akamaiConfigcmd);
        const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
=======
        const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOutputListIds.json"));
        const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOutputListIds.json"),"data");
>>>>>>> develop
        if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
        userEdgeWorkerID = await quickPickItem("Select EdgeWorker ID",listIds);
            userEdgeWorkerID = userEdgeWorkerID.substring(userEdgeWorkerID.lastIndexOf('|')+2);
            if(userEdgeWorkerID === '' || userEdgeWorkerID === undefined){
                throw new Error(ErrorMessageExt.empty_edgeWorkerID);
            }
        }
        const validate = await validateEgdeWorkerID(userEdgeWorkerID);
        if(validate === true){
            const uploadCmd = await akamiCLICalls.getUploadEdgeWorkerCmd("edgeworkers","upload",tarFilePath,userEdgeWorkerID,path.resolve(os.tmpdir(),"akamaiCLIOutputUpload.json"));
            const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(uploadCmd),path.resolve(os.tmpdir(),"akamaiCLIOutputUpload.json"),"msg");
            const msg = textForInfoMsg.upload_edgeWorker_success+`${tarFileName}`+" to EdgeWorker ID: "+`${userEdgeWorkerID}`;
            vscode.window.showInformationMessage(msg);
        }
        else{
            const msg =`${edgeworkerID} `+ErrorMessageExt.id_not_found+ErrorMessageExt.edgeWorkerId_notFound;
            throw new Error(msg);
        }
        return true;
    }catch(e:any){
        vscode.window.showErrorMessage(`Failed to upload Edgeworker id:${userEdgeWorkerID} due to `+e.toString());
        return false;
    }
};

export const validateEgdeWorkerID = async function(edgeWorkerID: string):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        try{
            let found:boolean=false;
<<<<<<< HEAD
            const akamaiConfigcmd = await akamaiCLIConfig.checkAkamaiConfig();
            const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"),akamaiConfigcmd);
            const edgeWorkerIDsString= await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
=======
            const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOutputListid.json"));
            const edgeWorkerIDsString= await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOutputListid.json"),"data");
>>>>>>> develop
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
    const mapQuickPickItems: Array<vscode.QuickPickItem> = [];
    listIdsJson.map((map: any) => mapQuickPickItems.push({
        label: `${map.name} || ${map.edgeWorkerId}`
    }));
    return new Promise(async (resolve, reject) => {
        const selected: vscode.QuickPickItem | undefined = await vscode.window.showQuickPick(mapQuickPickItems, {canPickMany: false});
        if (selected) {
            resolve(selected.label.toString());
        }
        else{
            reject("Edgeworker ID not provided");
        }
    });
};

