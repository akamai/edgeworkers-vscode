/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
const exec = require('child_process').exec;
import { Config } from './config';
const os = require('os');
const fs = require('fs');
const path = require('path');
import * as edgeWorkerCommands from './edgeWorkerCommands';
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
const config: Config = require('../config.json');

export const  callAkamaiCLIFOrEdgeWorkerIDs = async function(accountKey?: string) : Promise<string> {
    return new Promise(async (resolve, reject) => { 
        let akamaiCmd:string[] = ["akamai", "edgeworkers", "list-ids"];
        let cliCmd:string[] = ["--json","/tmp/output.json"];
        if (accountKey !== ''|| typeof accountKey !== undefined){
            const accountKeyParams:string[]= ["--accountkey",`${accountKey}`];
            akamaiCmd.push(...accountKeyParams);
        }
        akamaiCmd.push(...cliCmd);
        const command = generateCLICommand(akamaiCmd);
        const process= await exec(command, {maxBuffer: config.settings.bufferSize, timeout: config.settings.timeOut}, (error : any, stdout : string, stderr : string) => {
            if (error){
               fs.readFile("/tmp/output.json", "utf8", function(err:any, data:any) {
                    const json = JSON.parse(data);
                    reject(json.msg);
                });
            } else if (stdout){
                fs.readFile("/tmp/output.json", "utf8", function(err:any, data:any) {
                    resolve(data);
                });
            } else if (stderr){
                reject(stderr);
            }
            deleteOutput("/tmp/output.json");
        });    
    });
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
export const executeCLICommandExceptTarCmd = function(cmd : string, jsonFile?:string) : Promise<string> {
    return new Promise(async (resolve, reject) => {
        const process = exec(cmd, (error : string, stdout : string, stderr : string) => {
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

export const executeCLIOnlyForTarCmd = async function(bundleFolder:string, bundlepath:string,tarFileName:string) : Promise<string> {
    const cmd:string[]= ["cd",`${bundleFolder}`, "&&","tar","--disable-copyfile","-czvf",bundlepath, '--exclude="*.tgz"', "*"];
     
    await new Promise((resolve, reject) => {
        exec(generateCLICommand(cmd),{}, (error:any,stdout:string, stderr:string)=>{
            if (error) {
                const status = stderr.toString();
                reject(`${ErrorMessageExt.create_bundle_fail} ${tarFileName}.tgz ${ErrorMessageExt.display_original_error} ${status}`);
            } else {
                resolve(true);
            }
        });
    });

    // if the process above is done, we should assume the file is created
    return `Successfully created the EdgeWorker bundle - ${tarFileName}.tgz`;
};
export const executeDeleteFileCmd = async function(fullTarballPath: string):Promise<void>{
    const cmd:string[]= ["rm",fullTarballPath];
    const deleteCmd= generateCLICommand(cmd);
    const process= await executeCLICommandExceptTarCmd(deleteCmd);
    const fileExists = await edgeWorkerCommands.checkFile(fullTarballPath);
    if (fileExists) {
        throw new Error(ErrorMessageExt.file_replace_error + path.basename(fullTarballPath)); 
    }
};
export const getEdgeWorkerDownloadCmd = function(edgeworkerID:string,edgeworkerVersion:string,tarFilePath:string, accountKey:string):string[]{
    let downloadCmd:string[]= ["akamai","edgeworkers","download",`${edgeworkerID}`, `${edgeworkerVersion}`,"--downloadPath", `${tarFilePath}`];
    downloadCmd = addAccountKeyParams(downloadCmd,accountKey);
    return downloadCmd;
};
export const getEdgeWorkerValidateCmd = function(work_space_folder:string,tarfile:string,accountKey:string):string[]{
    let validateCmd:string[]= ["akamai","edgeworkers","validate",`${work_space_folder}/${tarfile}.tgz`];
    validateCmd = addAccountKeyParams(validateCmd,accountKey);
    return validateCmd;
};

export const getUploadEdgeWorkerCmd = function(bundlePath:string,edgeWorkerID:string,accountKey:string,edgeWorkerVersionID?:string):string[]{
    let uploadCmd:string[]= ["akamai","edgeworkers","upload","--bundle",`${bundlePath}`, `${edgeWorkerID}`, `${edgeWorkerVersionID}`];
    uploadCmd = addAccountKeyParams(uploadCmd,accountKey);
    return uploadCmd;
};
export const addAccountKeyParams = function(cmd:string[],accountKey:string):string[]{
    if (accountKey !== ''|| typeof accountKey !== undefined){
        const accountKeyParams:string[]= ["--accountkey",`${accountKey}`];
        cmd.push(...accountKeyParams);
    }
    return cmd;
};
export const generateCLICommand = function(cmdArgs: string[]):string{
    let command:string = '';
    if (typeof cmdArgs !== 'undefined' && cmdArgs.length > 0) {
        command = cmdArgs.join(" ").toString();
    }
    return command;
};
export const deleteOutput = function(path:string){
    exec(`rm ${path}`);
};

export const untarTarballToTempDir = async function (tarFilePath:string, edgeworkerBundle:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        try{
            const tarFileDir = '/tmp';
            deleteOutputFolder(`${tarFileDir}/${edgeworkerBundle}`);
            const statusUntar = await executeCLICommandExceptTarCmd(`mkdir ${tarFileDir}/${edgeworkerBundle}-${Date.now()} && tar -xf ${tarFilePath} -C  ${tarFileDir}/${edgeworkerBundle}`);
            resolve(`${tarFileDir}/${edgeworkerBundle}`);
        }catch(e){
            reject("failed to untar the file: "+`${edgeworkerBundle}`+ErrorMessageExt.display_original_error+e);
        }
    });
};
export const deleteOutputFolder = function(path:string){
    exec(`rm -rf ${path}`);
};

export const updateEdgeWorkerToSandboxCmd = function(bundlePath:string,edgeWorkerID:string,accountKey:string):string[]{
    let uploadCmd:string[]= ["akamai","sandbox","update-edgeworker", `${edgeWorkerID}`,`${bundlePath}` ];
    uploadCmd = addAccountKeyParams(uploadCmd,accountKey);
    return uploadCmd;
};

export const checkAkamaiSandbox = async function(akamaiSandboxCmd: string):Promise<boolean|string>{
    return new Promise(async (resolve, reject) => {
        try{
            const process= await executeCLICommandExceptTarCmd(akamaiSandboxCmd);
            resolve(true);
        }catch(e){
            const resp = await vscode.window.showErrorMessage(
                ErrorMessageExt.akamai_sandbox_not_installed,
                'Install'
                );
                if (resp === 'Install') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(ErrorMessageExt.akamai_sanbox_download));
                }
            reject(ErrorMessageExt.upload_EW_fail_by_no_sandbox+ ' at ' + vscode.Uri.parse(ErrorMessageExt.akamai_sanbox_download));
        }
    });
};
