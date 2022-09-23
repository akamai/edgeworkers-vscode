/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import * as akamiCLICalls from './akamiCLICalls';
import {getFilePathFromInput} from './extension';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const createAndValidateEdgeWorker = async function(folder:string){
    try{
        //check bundle.json as its mandatory file for edgeworker bundle; will throw an error if not found
        await searchBundle(folder,'bundle.json');
        //create edgeWorker Bundle
        const bundleValidateName = await createEdgeWorkerBundle(folder);
        //validate EdgeWorker bundle
        const bundleValidateCmd = await validateEdgeWorkerBundle(folder, bundleValidateName);
        vscode.window.showInformationMessage(bundleValidateCmd);
    }catch(e:any){
        vscode.window.showErrorMessage(e.toString());
    }
};
export const createEdgeWorkerBundle = async function(bundleFolder:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            const defaultFilename:string = 'edgeworkerBundle';
            let creatBundleFilePath;
            const tarFileName:string = await askUserForUserInput(textForInfoMsg.bundle_name,defaultFilename);
            const folderFSPath = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'select folder to create bundle',
            });
            if(folderFSPath !== undefined && folderFSPath.length >0){
                creatBundleFilePath = getFilePathFromInput(folderFSPath[0]);
            }
            else{
                throw new Error("Error: No folder path to create bundle provied");
            }
            const bundlepath = path.resolve(creatBundleFilePath,`${tarFileName}.tgz`);
            const tarballExists = await checkFile(bundlepath);
            if (tarballExists) {
                const resp = await vscode.window.showErrorMessage(
                    `${ErrorMessageExt.bundle_already_exists} + ${tarFileName}.tgz`,
                    ...['yes','no']
                );
                if(resp === 'yes'){
                    // there might be an exception thrown below but if so it will bubble out to the calling function
                    await akamiCLICalls.deleteOutput(bundlepath);
                    const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(creatBundleFilePath, bundlepath,`${tarFileName}`);
                    vscode.window.showInformationMessage(createBundleCmd);
                    resolve (`${tarFileName}`);
                }
                else{
                    resolve(`${tarFileName}`);
                }
            } else {
                // again there might be an exception thrown below but if so it will bubble out to the calling function
                const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(creatBundleFilePath, bundlepath,`${tarFileName}`);
                vscode.window.showInformationMessage(createBundleCmd);
                resolve (`${tarFileName}`);
            }
        }
        catch(e:any){
            reject(e);
        }
    });
};
export const validateEdgeWorkerBundle = async function( work_space_folder:string,tarfile:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            let tarFilePath = path.resolve(work_space_folder, `${tarfile}.tgz`);
            const cmd = await akamiCLICalls.getEdgeWorkerValidateCmd("edgeworkers","validate",tarFilePath,path.resolve(os.tmpdir(),"akamaiCLIOutputValidate.json"));
            const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOutputValidate.json"),"msg");
            resolve(textForInfoMsg.validate_bundle_success+`${tarfile}.tgz`);
        }catch(e:any){
            reject(ErrorMessageExt.validate_bundle_fail+`${tarfile}.tgz`+ErrorMessageExt.display_original_error+e.toString());
    }
    });
};
export const askUserForUserInput = async function(promptName: string,defaultValue:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        let options : vscode.InputBoxOptions = {};
        options.prompt = promptName;
        await vscode.window.showInputBox(options).then(userInput=> {
            if(userInput === '' || userInput === undefined){
                resolve(defaultValue);
            }
            else{
                resolve(userInput);
            }
        });
    });
};
export const getAccountKeyFromUserConfig= function():string{
        return(<string>workspace.getConfiguration('edgeworkers-vscode').get('accountKey'));
};
export const getSectionNameFromUserConfig= function():string{
    return(<string>workspace.getConfiguration('edgeworkers-vscode').get('sectionName'));
};
export const getEdgercFilePathFromUserConfig= function():string{
    return(<string>workspace.getConfiguration('edgeworkers-vscode').get('edgercFile'));
};
export const getCLIStatisticsEnable = function():boolean{
    if(workspace.getConfiguration('edgeworkers-vscode').get('enableCLIStatistics')){
        return true;
    }
    else{
        return false;
    }
};
export const getCLIUpdateCheckEnable= function():boolean{
    if(workspace.getConfiguration('edgeworkers-vscode').get('enableUpdateCheck')){
        return true;
    }
    else{
        return false;
    }
};


export const checkFile = async function(filePath: string): Promise<boolean> {
    try{
        if(fs.existsSync(filePath)) {
            return true;
        }
        else{
            return false;
        }
    }catch(e){
        return false;
    }
};
export const searchBundle = async function(bundleFolder:string,fileName: string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        const bundleJsonPath = path.resolve(bundleFolder,fileName);
        if (await checkFile(bundleJsonPath)) {
            resolve(textForInfoMsg.file_found+`${fileName}`);
        } else {
            reject(ErrorMessageExt.bundle_JSON_not_found+`${fileName}`);
        }
    });
};


function cath(e: any) {
    throw new Error('Function not implemented.');
}

