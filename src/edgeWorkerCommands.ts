/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import { ErrorMessage } from './openAPI/utils/http-error-message';
const cp = require('child_process');
const exec = require('child_process').exec;
const path = require('path');
import * as akamiCLICalls from './akamiCLICalls';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';

export const createAndValidateEdgeWorker = async function(folder:string){
    try{
        //check bundle.json as its mandatory file for edgeworker bundle; will throw an error if not found
        await searchBundle('bundle.json');
        //create edgeWorker Bundle
        const bundleValidateName = await createEdgeWorkerBundle(folder);

        // bundle tarball was created in parent folder so we need to resolve that
        const parentFolder = path.dirname(folder);

        //validate edge worker bundle
        const bundleValidateCmd = await validateEdgeWorkerBundle(parentFolder, bundleValidateName);
        vscode.window.showInformationMessage(bundleValidateCmd);
    }catch(e:any){
        vscode.window.showErrorMessage(e);
    }
};
export const createEdgeWorkerBundle = async function(bundleFolder:string):Promise<string>{
    const defaultFilename:string = 'edgeworkerBundle';
    const tarFileName:string|undefined = await askUserForUserInput(textForInfoMsg.bundle_name,defaultFilename);
    const parentFolder = path.dirname(bundleFolder);
    
    const fullTarballPath = `${parentFolder}/${tarFileName}.tgz`;
    // check if a tarball with that name already exists in the parent folder
    const tarballExists = await checkFile(fullTarballPath);

    if (tarballExists) {
        const resp = await vscode.window.showErrorMessage(
            `${ErrorMessageExt.bundle_already_exists} + ${tarFileName}.tgz`,
            ...['yes','no']
        );

        if(resp === 'yes'){
            // there might be an exception thrown below but if so it will bubble out to the calling function
            await akamiCLICalls.executeDeleteFileCmd(fullTarballPath);
            const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(bundleFolder, parentFolder,`${tarFileName}`);
            vscode.window.showInformationMessage(createBundleCmd);
            return (`${tarFileName}`);
        }
        else{
            return `${tarFileName}`
        }
    } else {
        // again there might be an exception thrown below but if so it will bubble out to the calling function
        const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(bundleFolder, parentFolder,`${tarFileName}`);
        vscode.window.showInformationMessage(createBundleCmd);
        return (`${tarFileName}`);
    }
};
export const validateEdgeWorkerBundle = async function( work_space_folder:string,tarfile:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        const accountKey = getAccountKeyFromUserConfig();
        try{
            const cmd = akamiCLICalls.getEdgeWorkerValidateCmd(work_space_folder,tarfile,accountKey);
            // let cmd:string[]= ["akamai","edgeworkers","validate",`${work_space_folder}/${tarfile}.tgz`];
            // if (accountKey !== ''|| typeof accountKey !== undefined){
            //     const accountKeyParams:string[]= ["--accountkey",`${accountKey}`];
            //     cmd.push(...accountKeyParams);
            // }
            const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmd));
            resolve(textForInfoMsg.validate_bundle_success+`${tarfile}.tgz`);
        }catch(e){
            reject(ErrorMessageExt.validate_bundle_fail+`${tarfile}.tgz`+ErrorMessageExt.display_original_error+e);
    }
    });
};
export const askUserForUserInput = async function(promptName: string,defaultValue:string):Promise<string|undefined>{
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
    let accountKey: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('accountKey');
    console.log(`account key ${accountKey}`);
    if(accountKey === '' || accountKey === undefined){
        return '';
    }
    else{
        return(accountKey);
    }
};
export const getSectionNameFromUserConfig= function():string{
    let sectionName: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('sectionName');
    console.log(`section name ${sectionName}`);
    return(sectionName);
};

export const checkFile = async function(fileName: string): Promise<boolean> {
    const files = await workspace.findFiles(`${fileName}`);
    if(files === undefined || files.length == 0){
        return false;
    }
    else {
        return true;
    }
};
export const searchBundle = async function(fileName: string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        if (await checkFile(`**/${fileName}`)) {
            resolve(textForInfoMsg.file_found+`${fileName}`);
        } else {
            reject(ErrorMessageExt.bundle_JSON_not_found+`${fileName}`);
        }
    });
};


function cath(e: any) {
    throw new Error('Function not implemented.');
}

