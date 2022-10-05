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
            fileName = "codeProfile-"+timestamp;
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
        const validUrl = checkURLifValid(urlValue);
        const ewTrace = await codeProfilerEWTrace(validUrl);

        const ipAddressForStaging = await getIPAddressForStaging(validUrl);
        const successCodeProfiler = await callCodeProfiler(validUrl,ipAddressForStaging,ewTrace,eventHanler,filePath,cpuProfileName,pragmaHeaders,otherHeaders);
        await flameVisualizerExtension(successCodeProfiler, filePath, cpuProfileName);
    }catch(e:any){
        throw Error("Failed to run code profiler."+e);
    }
};

export const checkURLifValid = function(url:string):URL{
    try{
        const urlObject = new URL(url);
        return urlObject;
    }catch(e:any){
        throw (`Provided url: ${url} is invalid`);
    }
};


let authCache : Map<string, any> = new Map();
export const codeProfilerEWTrace = async function(url:URL):Promise<string>{
    if (authCache.has(url.hostname)) {
        let result = authCache.get(url.hostname);

        // +500 to give a buffer
        if (result.expiry < Date.now() - 500) {
            return result.auth;
        }
    }
    try{
        const cmd = await akamaiCLICalls.getAkamaiEWTraceCmd("edgeworkers","auth",url.hostname,path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfile.json"));
        const status = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfile.json"),"msg");
        const akamaiEWValue = getAkamaiEWTraceValueFromCLIMsg(status);

        authCache.set(url.hostname, {expiry: Date.now(), auth: akamaiEWValue});
        return akamaiEWValue;
    }catch(e:any){
        throw (` Can't generate EW-trace for the provided URL: ${url} due to - ${e}`);
    }
};

export const getAkamaiEWTraceValueFromCLIMsg = function(ewTraceMsg:string):string{
    try{
        const index = ewTraceMsg.indexOf("Akamai-EW-Trace:");
        const length = ("Akamai-EW-Trace:").length;
        return ewTraceMsg.slice(index + length).trim();
    }catch(e:any){
        throw e;
    }
};

let stagingIpCache : Map<string, string> =  new Map();
export const getIPAddressForStaging = async function(url:URL):Promise<string>{
    try{
        if (stagingIpCache.has(url.hostname)) {
            let cacheValue : string|undefined = stagingIpCache.get(url.hostname);

            if (cacheValue != undefined) {
                return cacheValue;
            }
        }

        const cname = await cnameLookup(url.hostname);
        const cnameAkamaiStaging = await getStagingCname(cname);
        const ipAddress = await getIPAddress(cnameAkamaiStaging,url.hostname);

        stagingIpCache.set(url.hostname, ipAddress);

        return ipAddress;
    }catch(e:any){
        throw e;
    }
};

export const getCNAME = async function(hostName:string):Promise<string>{
    return new Promise(async (resolve, reject) => {
        dns.resolveCname(hostName,(err:any, cname:any) => {
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
        dns.lookup(cnameAkamai,(err:any, ipAddress:any) => {
          if (err) {
            reject(`Falied to get IP address for the host: ${hostName} due to - ${err}`);
          }
          resolve(ipAddress);
        });
      });
};
export const callCodeProfiler = async function(url:URL,ipAddress:string,ewtrace:string,eventHanler:string,filepath:string,fileName:string,pragmaHeaders?:string,otherheaders?:string[]):Promise<string>{
    const noEventHandler = `Can't generate code profile for provided event handler: ${eventHanler}. Check EdgeWorker code bundle for implemented event handlers.`;
    const agent = new Agent({
        servername: url.hostname,
        rejectUnauthorized: false,
    });
    const headers: { [key: string]: any } = {};
    headers.Host = url.hostname;
    headers['akamai-ew-trace'] = ewtrace;
    headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
    headers[`${eventHanler}`] = 'true';
    if(otherheaders){
        for(let i=0; i<otherheaders.length; i++){
            headers[`${otherheaders[i][0]}`] =  otherheaders[i][1];
        }
    }
    const httpParams:{[key:string]:any}={};
    httpParams['headers'] = headers;
    httpParams['httpsAgent'] = agent;
    httpParams['responseType'] = 'text';
    const httpCallString = url.toString().replace(url.hostname,ipAddress);
    
    try {
        let body = await axios.get(httpCallString,httpParams);
        let dataToFile:string|object = body.data;
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
    } catch(error:any) {
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
    }

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

const edgeHostnameEndings = [
    'edgekey.net',
    'edgesuite.net',
    'akamaiedge.net'
]
export const cnameLookup = async function(hostName:string):Promise<string>{
    const cname = await getCNAME(hostName);
    if(!cnanmeIsStagingCname(cname[0])){
        const cnameFinal = await getCNAME(cname[0]);
        return cnameFinal[0];
    }
    return cname[0];
};

export const cnanmeIsStagingCname = function(cname:string):boolean{
    const before_ = cname.substring(0, cname.indexOf(".net"));
    if (before_.endsWith("-staging")) {
        return true;
    }
    return false;
};
