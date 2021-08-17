/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import {workspace}from 'vscode';
import { ErrorMessage } from './openAPI/utils/http-error-message';
const cp = require('child_process');
const exec = require('child_process').exec;
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';

export const createAndValidateEdgeWorker = async function(work_space_folder:string){
    try{
        //check if Akami cli is installed or not on user system
        const statusCLI = await checkAkamaiCLI(work_space_folder);
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

export const checkAkamaiCLI = async function(work_space_folder:string):Promise<boolean>{
    return new Promise(async (resolve, reject) => {
        try{
            const cmd:string[]= ["cd",`${work_space_folder}`, "&&",textForCmd.akamai_version];
            const process= await executeCLICommandExceptTarCmd(generateCLICommand(cmd));
            resolve(true);
        }catch(e){
            const resp = await vscode.window.showErrorMessage(
                ErrorMessageExt.akamai_cli_not_installed,
                'Install'
              );
              if (resp === 'Install') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(ErrorMessageExt.edgeworker_download_URI));
              }
        }
    });
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
                const deleteBundleCmd = await executeDeleteFileCmd(work_space_folder, `${tarFile}`);
                const createBundleCmd = await executeCLIOnlyForTarCmd(work_space_folder,`${tarFile}`);
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
                const createBundleCmd = await executeCLIOnlyForTarCmd(work_space_folder,`${tarFile}`);
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
        const cmdWithoutAccountKey:string[]= ["akamai","edgeworkers","validate",`${work_space_folder}/${tarfile}.tgz`];
        if (accountKey !== ''|| typeof accountKey !== undefined){
            let cmdWithAccountKey:string[]= ["--accountkey",`${accountKey}`];
            cmdWithAccountKey= cmdWithoutAccountKey.concat(cmdWithAccountKey);
            const status = await executeCLICommandExceptTarCmd(generateCLICommand(cmdWithAccountKey));
            resolve(textForInfoMsg.validate_bundle_success+`${tarfile}.tgz`);
        }
        else{
            const status = await executeCLICommandExceptTarCmd(generateCLICommand(cmdWithoutAccountKey));
            resolve(textForInfoMsg.validate_bundle_success+`${tarfile}.tgz`);
        }
    }catch(e){
        reject(ErrorMessageExt.validate_bundle_fail+`${tarfile}.tgz`+ErrorMessageExt.display_original_error+e);
    }
    });
};
export const createBundlecmdStatus = async function( work_space_folder:string,tarFile:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            const createBundlecmd = await executeCLIOnlyForTarCmd(work_space_folder,tarFile);
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
export const executeCLICommandExceptTarCmd = function(cmd : string) : Promise<string> {
    return new Promise(async (resolve, reject) => {
        const process = exec(cmd, (error : any, stdout : string, stderr : string) => {
            if (error) {
                reject(error);
            }
            else if (stdout){
                resolve(stdout);
            }
            else if(stderr){
                reject(stderr);
            }
            else{
                resolve('done');
            }
        });
    });
};
export const executeCLIOnlyForTarCmd = function(work_space_folder:string,tarfilename : string) : Promise<string> {
    return new Promise(async (resolve, reject) => {
        let status:string = "sucessfull";
        const cmd:string[]= ["cd",`${work_space_folder}`, "&&","tar","--disable-copyfile","-czvf",`${tarfilename}.tgz`, '--exclude="*.tgz"', "*"];
        const process= await exec(generateCLICommand(cmd),(error:any,stdout:string, stderr:string)=>{
            if (error) {
                status=stderr.toString();
                reject(ErrorMessageExt.create_bundle_fail+`${tarfilename}.tgz`+ " --due to -- "+status);
            }
        });
        if(status=== "sucessfull"){
            const check = await checkFile(`**/${tarfilename}.tgz`);
            if(check=== true){
            resolve("Successfully created the EdgeWorker bundle - " + `${tarfilename}.tgz`);
            }
            else{
                reject(ErrorMessageExt.create_bundle_fail+`${tarfilename}.tgz`+ ErrorMessageExt.display_original_error +process.stderr.toString());
            }
        }
    });
};
export const executeDeleteFileCmd = function(work_space_folder:string,tarfilename: string):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        const cmd:string[]= ["cd",`${work_space_folder}`, "&&","rm",`${tarfilename}.tgz`];
        const deleteCmd= generateCLICommand(cmd);
        try{
            const process= await executeCLICommandExceptTarCmd(deleteCmd);
            const check = await checkFile(`**/${tarfilename}.tgz`);
            reject(ErrorMessageExt.file_replace_error+`${tarfilename}.tgz`); 
        }catch(e){
            resolve(true); 
        }
    });
};
export const generateCLICommand = function(cmdArgs: string[]):string{
    let command:string = '';
    if (typeof cmdArgs !== 'undefined' && cmdArgs.length > 0) {
        command = cmdArgs.join(" ").toString();
    }
    return command;
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

