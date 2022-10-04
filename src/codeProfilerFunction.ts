/* eslint-disable no-throw-literal */
/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';
import axios from 'axios';
import { Agent } from 'https';
const extract = require('extract-json-from-string');
import isHTML from 'is-html';
import * as akamaiCLIConfig from './cliConfigChange';
const tmpDir = require('os').tmpdir();
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as akamaiCLICalls from './akamaiCLICalls';
import { URL } from 'url';
import { Workbench } from 'vscode-extension-tester';


export const getCodeProfilerFile = async function(filePath:string,fileName:string,urlValue:string,eventHanler:string,pragmaHeaders:string,otherHeaders:string[]){
    const dateNow = new Date();
    const timestamp = dateNow.getTime().toString();
    try{
        if(!fileName){
            fileName = "codeProfiler"+timestamp;
        }
        else{
            fileName = fileName + timestamp;
        }
        if(!filePath){
            filePath = tmpDir;
        }
        const cpuProfileName = fileName+'.cpuprofile';
        if(!fs.existsSync(filePath)){
            throw Error(`Provided file path: ${filePath} does not exists.`);
        }
        const validUrl = await checkURLifValid(urlValue);
        const ewTrace = await codeProfilerEWTrace(validUrl);
        const ipAddressForStaging = await getIPAddressForStaging(validUrl);
        const successCodeProfiler = await callCodeProfiler(validUrl,ipAddressForStaging,ewTrace,eventHanler,filePath,cpuProfileName,pragmaHeaders,otherHeaders);
        await flameVisualizerExtension(successCodeProfiler, filePath, cpuProfileName);
    }catch(e:any){
        throw Error("Failed to run code profiler."+e);
    }
};


export const checkURLifValid = async function(url:string):Promise<URL>{
    try{
        const urlObject = new URL(url);
        return urlObject;
    }catch(e:any){
        throw (`Provided url: ${url} is invalid`);
    }
};

export const codeProfilerEWTrace = async function(url:URL):Promise<string>{
    try{
        const cmd = await akamaiCLICalls.getAkamaiEWTraceCmd("edgeworkers","auth",url.hostname,path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfiler.json"));
        const status = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfiler.json"),"msg");
        const akamaiEWValue = await  getAkamaiEWTraceValueFromCLIMsg(status);
        return akamaiEWValue;
    }catch(e:any){
        throw (` Can't generate EW-trace for the provided URL: ${url} due to - ${e}`);
    }
};
export const getAkamaiEWTraceValueFromCLIMsg = async function(ewTraceMsg:string):Promise<string>{
    try{
        const index = ewTraceMsg.indexOf("Akamai-EW-Trace:");   // 8
        const length = ("Akamai-EW-Trace:").length;            // 7
        return ewTraceMsg.slice(index + length).trim();
    }catch(e:any){
        throw e;
    }
};
export const getIPAddressForStaging =  async function(url:URL):Promise<string>{
    try{
    const cnameFinal = await cnameLookup(url.hostname);
    const CNAMEAkamaiStaging = await getStagingCname(cnameFinal);
    const ipAddress = await getIPAddress(CNAMEAkamaiStaging,url.hostname);
    return ipAddress;
    }catch(e:any){
        throw e;
    }
};

export const getCNAME = async function(hostName:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        await dns.resolveCname(hostName,(err:any, cname:any) => {
          if (err) {
            reject(`Can't fetch CNAME for the Host:${hostName} due to - ${err}`);
          }
          resolve(cname);
        });
      });
};


export const getStagingCname = async function(cnameBefore:string):Promise<string>{
    const before_ = cnameBefore.substring(0, cnameBefore.indexOf(".net"));
    if (before_.endsWith("-staging")) {
        return cnameBefore;
    } else {
        const akamaiStaging = before_+"-staging"+".net";
        return akamaiStaging;
    }
};
export const getIPAddress = async function getIPAddress(cnameAkamai:string, hostName:string):Promise<string> {
    return new Promise(async (resolve, reject) => {
       await dns.lookup(cnameAkamai,(err:any, ipAddress:any) => {
          if (err) {
            reject(`Falied to get IP address for the host: ${hostName} due to - ${err}`);
          }
          resolve(ipAddress);
        });
      });
};
export const callCodeProfiler = async function(url:URL,ipAddress:string,ewtrace:string,eventHanler:string,filepath:string,fileName:string,pragmaHeaders?:string,otherheaders?:string[]):Promise<string>{
    const noEventHandler = `Can't generate code profile for provided event handler: ${eventHanler}. Check EdgeWorker code bundle for implemented event handlers.`;
    const agent = await new Agent({
        servername: url.hostname,
        rejectUnauthorized: false,
    });
    const headers: { [key: string]: any } = {};
    headers.Host = url.hostname;
    headers['akamai-ew-trace'] = ewtrace;
    headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
    headers[`${eventHanler}`] = 'asd';
    if(otherheaders){
        for(var i=0; i<otherheaders.length; i++){
            headers[`${otherheaders[i][0]}`] =  otherheaders[i][1];
        }
    }
    const httpParams:{[key:string]:any}={};
    httpParams['headers'] = headers;
    httpParams['httpsAgent'] = agent;
    httpParams['responseType'] = 'text';
    const httpCallString = url.toString().replace(url.hostname,ipAddress);
    await axios.get(httpCallString,httpParams).then((body) => {
        var dataToFile:string|object = body.data;
        if(typeof dataToFile === 'object'){
            dataToFile = JSON.stringify(dataToFile);
        }
        const textToFile = extract(dataToFile);
        if(textToFile.length === 0)
        {
            throw noEventHandler;
        }
        else{
            fs.writeFile(path.resolve(filepath,fileName), JSON.stringify(textToFile[0]), 'utf8', function (err:any) {
                if (err) {
                    throw err;
                }
            });
        }
    }).catch((error:any) => {
    if (error.response) {
        if(isHTML(error.response.data)){
            const textToFile = extract(error.response.data);
            if(textToFile.length === 0)
            {
                throw noEventHandler;
            }
        }
        else{
            throw error.response.data;
        }
    } else if (error.request) {
        throw error;
    } else {
        throw (`Falied to generate ${fileName} due to - ${error}`);
    }
    });
    return `Successfully downloaded the ${fileName} at ${filepath}.`;
};

export const flameVisualizerExtension = async function(msg:string,filePath:string, fileName:string){
    const checkFlameGrapghExt= await vscode.extensions.getExtension('ms-vscode.vscode-js-profile-flame');
    if(!checkFlameGrapghExt){
        const resp = await vscode.window.showInformationMessage(`${msg} ${textForInfoMsg.cpuProfileOptionMsg}`, 'Download','Cancel');
        if (resp === 'Download') {
            try{
                await  vscode.commands.executeCommand('workbench.extensions.installExtension','ms-vscode.vscode-js-profile-flame');
                vscode.window.showInformationMessage(textForInfoMsg.cpuprofileFileDownloadSuccess+` ${fileName} is available at ${filePath}`);
            }catch(err:any){
                vscode.window.showErrorMessage(`${ErrorMessageExt.downloadFlameExtFail}`+`${err.toString()}. ${textForInfoMsg.downloadFlameExtManually}`);
            }
        }
        else{
            vscode.window.showInformationMessage(`${fileName} is available at ${filePath}`+ textForInfoMsg.downloadFlameExtManually);
        }
    }
    else{
        vscode.window.showInformationMessage(msg);  
    }
    await openCpuProfileFile(fileName,filePath); 
};

export const openCpuProfileFile = async function(fileName:string, filePath:string){
    const fileUriPath = await path.resolve(filePath,fileName);
    const uriFilePath = vscode.Uri.file(fileUriPath);
    try{
        await vscode.commands.executeCommand('vscode.open',uriFilePath);
    }catch(e:any){
        vscode.window.showErrorMessage(`Can't open the ${fileName} at ${filePath} automatically due to - ${e}. Open ${fileName} file at path ${filePath}`);
    }
};
export const cnameLookup = async function(hostName:string):Promise<string>{
    const cname = await getCNAME(hostName);
    if(! await cnanmeIsStagingCname(cname[0])){
        const cnameFinal = await getCNAME(cname[0]);
        return cnameFinal[0];
    }
    return cname[0];
};
export const cnanmeIsStagingCname = async function(cname:string):Promise<boolean>{
    const before_ = cname.substring(0, cname.indexOf(".net"));
    if (before_.endsWith("-staging")) {
        return true;
    }
    return false;
};
