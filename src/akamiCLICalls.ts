/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
const exec = require('child_process').exec;
import { Config } from './config';
const os = require('os');
const fs = require('fs');
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
            deleteOutput();
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
        let status:string = "successfull";
        const cmd:string[]= ["cd",`${work_space_folder}`, "&&","tar","--disable-copyfile","-czvf",`${tarfilename}.tgz`, '--exclude="*.tgz"', "*"];
        const process= await exec(generateCLICommand(cmd),(error:any,stdout:string, stderr:string)=>{
            if (error) {
                status=stderr.toString();
                reject(ErrorMessageExt.create_bundle_fail+`${tarfilename}.tgz`+ " --due to -- "+status);
            }
        });
        if(status=== "sucessfull"){
            const check = await edgeWorkerCommands.checkFile(`**/${tarfilename}.tgz`);
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
            const check = await edgeWorkerCommands.checkFile(`**/${tarfilename}.tgz`);
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

export const deleteOutput = function(){
    exec("rm  /tmp/output.json");
};