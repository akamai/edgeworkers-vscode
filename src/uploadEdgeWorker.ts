/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamaiCLICalls from './akamaiCLICalls';
import * as akamaiCLIConfig from './cliConfigChange';
import * as os from 'os';
import * as path from 'path';

export const uploadEdgeWorker = async function(tarFilePath: string,edgeWorkerId:string):Promise<boolean>{
    let useredgeWorkerId :string = edgeWorkerId;
    const tarFileName = path.parse(tarFilePath).base;
    try{
        const akamaiConfigcmd = await akamaiCLIConfig.checkAkamaiConfig();
        const tempFile = `akamaiCLIOutput-${Date.now()}.json`;
        const listIdsCmd= await akamaiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),tempFile));
        const listIds = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),tempFile),"data");
        if(useredgeWorkerId === '' || useredgeWorkerId === undefined){
        useredgeWorkerId = await quickPickItem("Select EdgeWorker ID",listIds);
            useredgeWorkerId = useredgeWorkerId.substring(useredgeWorkerId.lastIndexOf('|')+2);
            if(useredgeWorkerId === '' || useredgeWorkerId === undefined){
                throw new Error(ErrorMessageExt.empty_edgeWorkerId);
            }
        }
        const validate = await validateEgdeWorkerID(useredgeWorkerId);
        if(validate === true){
            const uploadCmd = await akamaiCLICalls.getUploadEdgeWorkerCmd("edgeworkers","upload",tarFilePath,useredgeWorkerId,path.resolve(os.tmpdir(),"akamaiCLIOutputUpload.json"));
            const status = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(uploadCmd),path.resolve(os.tmpdir(),"akamaiCLIOutputUpload.json"),"msg");
            const msg = textForInfoMsg.upload_edgeWorker_success+`${tarFileName}`+" to EdgeWorker ID: "+`${useredgeWorkerId}`;
            vscode.window.showInformationMessage(msg);
        }
        else{
            const msg =`${edgeWorkerId} `+ErrorMessageExt.id_not_found+ErrorMessageExt.edgeWorkerId_notFound;
            throw new Error(msg);
        }
        return true;
    }catch(e:any){
        vscode.window.showErrorMessage(`Failed to upload Edgeworker id:${useredgeWorkerId} due to `+e.toString());
        return false;
    }
};

export const validateEgdeWorkerID = async function(edgeWorkerId: string):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        try{
            let found:boolean=false;
            const akamaiConfigcmd = await akamaiCLIConfig.checkAkamaiConfig();
            const tempFile = `akamaiCLIOutput-${Date.now()}.json`;
            const listIdsCmd= await akamaiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),tempFile));
            const edgeWorkerIdsString= await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),tempFile),"data");
            const edgeWorkerIdsJson = JSON.parse(edgeWorkerIdsString);
            edgeWorkerIdsJson.find((element:any) => {
                if(edgeWorkerId === element.edgeWorkerId.toString()){
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

