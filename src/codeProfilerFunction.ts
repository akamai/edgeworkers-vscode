/* eslint-disable no-throw-literal */
/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import * as vscode from 'vscode';
const fs = require('fs');
const os = require('os');
const path = require('path');
const dns = require('node:dns');
import axios from 'axios';
import { Agent } from 'https';
const util = require('util');
const stream = require('stream');
const extract = require('extract-json-from-string');
const pipeline = util.promisify(stream.pipeline);
import {textForCmd,ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as akamiCLICalls from './akamiCLICalls';
import { URL } from 'url';

export const getCodeProfilerFile = async function(filePath:string,fileName:string,urlValue:string,eventHanler:string,pragmaHeaders:string,otherHeaders:string[]):Promise<string>{
    try{
        const cpuProfileName = fileName+'.cpuprofile';
        if(!fs.existsSync(filePath)){
            throw Error(`Provided file path: ${filePath} does not exists.`);
        }
        const validUrl = await checkURLifValid(urlValue);
        const ewTrace = await codeProfilerEWTrace(validUrl);
        const ipAddressForStaging = await getIPAddressForStaging(validUrl);
        const successCodeProfiler = await callCodeProfiler(validUrl,ipAddressForStaging,ewTrace,eventHanler,filePath,cpuProfileName,pragmaHeaders,otherHeaders);
        return successCodeProfiler;
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
        const cmd = await akamiCLICalls.getAkamaiEWTraceCmd("edgeworkers","auth",url.hostname,path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfiler.json"));
        const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOputCodeProfiler.json"),"msg");
        const akamaiEWValue = getAkamaiEWTraceValueFromCLIMsg(status);
        return akamaiEWValue;
    }catch(e:any){
        throw (`Can't generate EW-trace for the provided URL: ${url} due to - ${e}`);
    }
};
export const getAkamaiEWTraceValueFromCLIMsg = async function(ewTraceMsg:string):Promise<string>{
    try{
        const index = ewTraceMsg.indexOf("Akamai-EW-Trace:");   // 8
        const length = ("Akamai-EW-Trace:").length;			// 7
        return ewTraceMsg.slice(index + length).trim();
    }catch(e:any){
        throw e;
    }
};
export const getIPAddressForStaging =  async function(url:URL):Promise<string>{
    try{
    const CNAME1 = await getCNAME(url.hostname);
    const CNAMEWithEDGE = await getCNAME(CNAME1[0]);
    const CNAMEAkamaiStaging = await getStagingCname(CNAMEWithEDGE[0]);
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
    const akamiStaging = before_+"-staging"+".net";
    return akamiStaging;
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
    const agent = await new Agent({
        servername: url.hostname,
        rejectUnauthorized: false,
    });
    const headers: { [key: string]: any } = {};
    headers.Host = url.hostname;
    headers['akamai-ew-trace'] = ewtrace;
    headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
    headers[`${eventHanler}`] = 'asd';
    if(pragmaHeaders){
        headers['Pragma'] = pragmaHeaders;
    }
    if(otherheaders){
        for(var i=0; i<otherheaders.length; i++){
            headers[`${otherheaders[i][0]}`] =  headers[`${otherheaders[i][1]}`];
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
            throw `Can't generate code profiler for provided event handler:${eventHanler}. Check Edgeworker code bundle to get right implemented event handler`;
        }
        else{
            fs.writeFile(path.resolve(filepath,fileName), JSON.stringify(textToFile[0]), 'utf8', function (err:any) {
                if (err) {
                    throw err;
                }
            });
        }
    }).catch((error:any) => {
        throw (`Falied to generate ${fileName} due to - ${error}`);
    });
    return `Successfully downloaded the ${fileName} at ${filepath}`;
};
