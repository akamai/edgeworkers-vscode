/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import { ErrorMessage } from './openAPI/utils/http-error-message';
const cp = require('child_process');
const exec = require('child_process').exec;
import * as akamiCLICalls from './akamiCLICalls';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';

export const createAndValidateEdgeWorker = async function(work_space_folder:string){
    try{
        //check if Akami cli is installed or not on user system
        const statusCLI = await akamiCLICalls.checkAkamaiCLI(work_space_folder);
        //check bundle.json as its mandatory file for edgeworker bundle
        const checkFileBundleJson  = await searchBundle('bundle.json');
        //create edgeWorker Bundle
        const bundleValidateName   = await createEdgeWorkerBundle(work_space_folder);
        //validate edge worker bundle
        const bundleValidateCmd = await validateEdgeWorkerBundle(work_space_folder,bundleValidateName);
        vscode.window.showInformationMessage(bundleValidateCmd);
    }catch(e){
        vscode.window.showErrorMessage(e);
    }
};
export const createEdgeWorkerBundle = async function( work_space_folder:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        const tarFile:string|undefined = await askUserForFileName(textForInfoMsg.bundle_name);
        try{
            const checkTar = await checkFile(`**/${tarFile}.tgz`);
            const resp = await vscode.window.showErrorMessage(
                `${ErrorMessageExt.bundle_already_exists} + ${tarFile}.tgz`,
                ...['yes','no']
            );
            if(await resp === 'yes'){
                try{
                    const deleteBundleCmd = await akamiCLICalls.executeDeleteFileCmd(work_space_folder, `${tarFile}`);
                    const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(work_space_folder,`${tarFile}`);
                    vscode.window.showInformationMessage(createBundleCmd);
                    resolve(`${tarFile}`);
                }catch(e){
                    reject(e);
                }
            }
            else{
                try{
                    resolve(`${tarFile}`);
                }catch(e){
                    reject(e);
                }
            }
        }catch(e){
            try{
                const createBundleCmd = await akamiCLICalls.executeCLIOnlyForTarCmd(work_space_folder,`${tarFile}`);
                vscode.window.showInformationMessage(createBundleCmd);
                resolve(`${tarFile}`);
            }catch(e){
                reject(`false`);
            }
        }
    });
};
export const validateEdgeWorkerBundle = async function( work_space_folder:string,tarfile:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        const accountKey = getAccountKeyFromUserConfig();
        try{
            let cmd:string[]= ["akamai","edgeworkers","validate",`${work_space_folder}/${tarfile}.tgz`];
            if (accountKey !== ''|| typeof accountKey !== undefined){
                const accountKeyParams:string[]= ["--accountkey",`${accountKey}`];
                cmd.push(...accountKeyParams);
            }
            const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmd));
            resolve(textForInfoMsg.validate_bundle_success+`${tarfile}.tgz`);
        }catch(e){
            reject(ErrorMessageExt.validate_bundle_fail+`${tarfile}.tgz`+ErrorMessageExt.display_original_error+e);
    }
    });
};
export const createBundlecmdStatus = async function( work_space_folder:string,tarFile:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            const createBundlecmd = await akamiCLICalls.executeCLIOnlyForTarCmd(work_space_folder,tarFile);
            vscode.window.showInformationMessage(createBundlecmd);
            resolve(createBundlecmd);
        }catch(e){
            vscode.window.showErrorMessage(e);
            reject(e); 
        }
    });
};

export const askUserForFileName = async function(promptName: string):Promise<string|undefined>{
    return new Promise(async (resolve, reject) => {
        let options : vscode.InputBoxOptions = {};
        let filename:string = 'edge_Worker_Bundle';
        options.prompt = promptName;
        await vscode.window.showInputBox(options).then(value=> {
            if(value === '' || value === undefined){
                resolve(filename);
            }
            else{
                resolve(value);
            }
        });
    });
};
export const getAccountKeyFromUserConfig= function():string{
    let accountKey: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('accountKey');
    console.log(`account key ${accountKey}`);
    return(accountKey);
};
export const getSectionNameFromUserConfig= function():string{
    let sectionName: string = <string>workspace.getConfiguration('edgeworkers-vscode').get('sectionName');
    console.log(`section name ${sectionName}`);
    return(sectionName);
};

export  const checkFile = async function(fileName: string): Promise<boolean>{
    return new Promise(async (resolve, reject) => {
        workspace.findFiles(`${fileName}`).then(files => { 
            if(files.length < 1 || files === undefined ){
                reject(false);
            }
            else
            {
                resolve(true);
            }
        });
    });
};
export const searchBundle = async function(fileName: string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            const status = await checkFile(`**/${fileName}`);
            resolve(textForInfoMsg.file_found+`${fileName}`);
        }catch(e){
            reject(ErrorMessageExt.bundle_JSON_not_found+`${fileName}`);
        }
    });
};


function cath(e: any) {
    throw new Error('Function not implemented.');
}

