/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
const exec = require('child_process').exec;
import { Config } from './config';
const os = require('os');
const fs = require('fs');
const path = require('path');
import * as edgeWorkerCommands from './edgeWorkerCommands';
import {textForCmd,ErrorMessageExt,textForInfoMsg,systemType } from './textForCLIAndError';
const config: Config = require('../config.json');
const ostype = os.type();

export const  callAkamaiCLIFOrEdgeWorkerIDs = async function(accountKey?: string) : Promise<string> {
    return new Promise(async (resolve, reject) => { 
        const outPutFilePath = path.resolve(os.tmpdir(),'output.json');
        let akamaiCmd:string[] = ["akamai", "edgeworkers", "list-ids"];
        let cliCmd:string[] = ["--json",`${outPutFilePath}`];
        if (accountKey !== ''|| typeof accountKey !== undefined){
            const accountKeyParams:string[]= ["--accountkey",`${accountKey}`];
            akamaiCmd.push(...accountKeyParams);
        }
        akamaiCmd.push(...cliCmd);
        const command = generateCLICommand(akamaiCmd);
        const process= await exec(command, {maxBuffer: config.settings.bufferSize, timeout: config.settings.timeOut}, (error : any, stdout : string, stderr : string) => {
            if (error){
               fs.readFile(outPutFilePath, "utf8", function(err:any, data:any) {
                    const json = JSON.parse(data);
                    reject(json.msg);
                });
            } else if (stdout){
                fs.readFile(outPutFilePath, "utf8", function(err:any, data:any) {
                    resolve(data);
                });
            } else if (stderr){
                reject(stderr);
            }
            deleteOutput(outPutFilePath);
        });    
    });
};
export const isAkamaiCLIInstalled = async function():Promise<boolean>{
    try{
        const cmd:string[]= [`${textForCmd.akamai_version}`];
        const process = await executeCLICommandExceptTarCmd(generateCLICommand(cmd));
        return true;
    } catch(e){
        return false;
    }
};
export const executeCLICommandExceptTarCmd = function(cmd : string, jsonFile?:string) : Promise<string> {
    // wrap exec in a promise
    return new Promise(async (resolve, reject) => {
        exec(cmd, (error : Error, stdout : string, stderr : string) => {
            if (error) {
                if (stderr) {
                    reject(stderr);
                } else {
                    reject('failure');
                }
            } else {
                if (stdout){
                    resolve(stdout);
                } else {
                    resolve('done');
                }
            }
        });
    });
};

export const executeCLIOnlyForTarCmd = async function(bundleFolder:string, bundlepath:string,tarFileName:string) : Promise<string> {
  const cmd = await getTarCmd(bundleFolder,bundlepath,tarFileName);
    // on command error an exception will be thrown to bubble outwrad
    await new Promise((resolve, reject) => {
        exec(generateCLICommand(cmd),{}, (error:any,stdout:string, stderr:string)=>{
            if (error) {
                const errorString = error.toString();
                if( (errorString.includes('is not recognized as an internal or external command') === true) && ostype === systemType.windows){
                    reject(`${ErrorMessageExt.windowsTarCmdUnfound}`);
                }
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
export const  getTarCmd = async function(bundleFolder:string,bundlepath:string,tarFileName:string):Promise<Array<string>>{
        return(  ["cd",`${bundleFolder}`, "&&","tar","--disable-copyfile","-czvf",bundlepath, '--exclude="*.tgz"', "*"]);
};
export const executeDeleteFileCmd = async function(fullTarballPath: string):Promise<void>{
    const cmd =await  deleteFileCmd(fullTarballPath);
    const deleteCmd= generateCLICommand(cmd);
    const process= await executeCLICommandExceptTarCmd(deleteCmd);
    const fileExists = await edgeWorkerCommands.checkFile(fullTarballPath);
    if (fileExists) {
        throw new Error(ErrorMessageExt.file_replace_error + path.basename(fullTarballPath)); 
    }
};
export const deleteFileCmd = async function(fullTarballPath:string):Promise<Array<string>>{
    if(ostype === systemType.windows){
       return( ["del",fullTarballPath]);
    }
   else{
        return(["rm",fullTarballPath]);
    }

};
export const getEdgeWorkerDownloadCmd = function(edgeworkerID:string,edgeworkerVersion:string,tarFilePath:string, accountKey:string):string[]{
    let downloadCmd:string[]= ["akamai","edgeworkers","download",`${edgeworkerID}`, `${edgeworkerVersion}`,"--downloadPath", `${tarFilePath}`];
    downloadCmd = addAccountKeyParams(downloadCmd,accountKey);
    return downloadCmd;
};
export const getEdgeWorkerValidateCmd = function(tarFilePath:string,accountKey:string):string[]{
    let validateCmd:string[]= ["akamai","edgeworkers","validate",tarFilePath];
    validateCmd = addAccountKeyParams(validateCmd,accountKey);
    return validateCmd;
};

export const getUploadEdgeWorkerCmd = function(bundlePath:string,edgeWorkerID:string,accountKey:string):string[]{
    let uploadCmd:string[]= ["akamai","edgeworkers","upload","--bundle",`${bundlePath}`, `${edgeWorkerID}`];
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
        console.log("command:" + command);
    }
    return command;
};
export const deleteOutput = function(path:string){
    let deleteFile:string = '';
    if(ostype === systemType.windows){
        deleteFile =  `del ${path}`;
    }
    else{
        deleteFile =  `rm  ${path}`;
    }
    exec(deleteFile);
};

export const untarTarballToTempDir = async function (tarFilePath:string, edgeworkerBundle:string):Promise<string>{
    try{
        const tarFileDir = os.tmpdir();
        const tempfol = path.resolve(tarFileDir,edgeworkerBundle);
        const tempFolder = `${tempfol}-${Date.now()}`;
        deleteOutputFolder(tempFolder);
        const statusUntar = await executeCLICommandExceptTarCmd(`mkdir ${tempFolder} && tar -xf ${tarFilePath} -C  ${tempFolder}`);
        return tempFolder;
    }catch(e){
        throw("failed to untar the file: "+`${edgeworkerBundle}`+ErrorMessageExt.display_original_error+e);
    }
};
export const deleteOutputFolder = function(path:string){
    let deleteFolder:string = '';
    if(ostype === systemType.windows){
        deleteFolder = `rmdir /Q /S ${path}`;
    }
    else{
        deleteFolder = `rm -rf ${path}`;
    }
    exec(deleteFolder);
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
