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
import isHTML from 'is-html';
const tmpDir = require('os').tmpdir();
import {ErrorMessageExt,textForInfoMsg } from './textForCLIAndError';
import * as akamaiCLICalls from './akamaiCLICalls';
import { URL } from 'url';

let lastRequestTime:number = 0;
export const getCodeProfilerFile = async function(filePath:string,fileName:string,urlValue:string,eventHanler:string,pragmaHeaders:string,otherHeaders:string[][]){
    const dateNow = new Date();
    const timeSinceEpoch = dateNow.getTime();
    if (lastRequestTime + 1000 > timeSinceEpoch) {
        throw ('Please wait at least 1 second between profiling requests.');
    }

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
        let cpuProfileName : string = fileName+'.cpuprofile';

        if(!fs.existsSync(filePath)){
            throw Error(`Provided file path: ${filePath} does not exists.`);
        }
        const validUrl = checkURLifValid(urlValue);

        let ewTrace : string = '';

        // allow specifying trace as a request header
        if (otherHeaders.length > 0) {
            // let's first make the input headers sane to access
            let headerMap : Map<string, string> = new Map<string, string>();
            for (let index = 0; index < otherHeaders.length; index++) {
                headerMap.set(otherHeaders[index][0].toLowerCase(), otherHeaders[index][1]);
            }

            if (headerMap.has('akamai-ew-trace')) {
                ewTrace = headerMap.get('akamai-ew-trace')!;
            }
            if(headerMap.has('x-ew-code-profile-memory')) {
                cpuProfileName = fileName+'.heapprofile';
            }
        }

        // if we didn't find a trace above go and get one :)
        if (ewTrace === '') {
            let hostHeader:string|undefined = getHostHeader(otherHeaders);
            
            let hostToCallAuthWith = validUrl.hostname;
            if (hostHeader) {
                hostToCallAuthWith = hostHeader;
            }

            ewTrace = await codeProfilerEWTrace(hostToCallAuthWith);
        }

        //use IP to test at the lab, use HOST header to set host name
        //const ipAddress = validUrl.hostname;
        
        const ipAddress = await getIPAddressForStaging(validUrl);

        const successCodeProfiler = await callCodeProfiler(validUrl,ipAddress,ewTrace,eventHanler,filePath,cpuProfileName,pragmaHeaders,otherHeaders);
        lastRequestTime = timeSinceEpoch;
        await flameVisualizerExtension(successCodeProfiler, filePath, cpuProfileName);
    }catch(e:any){
        throw Error("Failed to profile code: " +e);
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
export const codeProfilerEWTrace = async function(hostname:string):Promise<string>{
    if (authCache.has(hostname)) {
        let result = authCache.get(hostname);

        if (result.expiry > Date.now()) {
            return result.auth;
        }
    }
    try{
        const tempFile = `akamaiCLIOutputAuth-${Date.now()}.json`;
        const cmd = await akamaiCLICalls.getAkamaiEWTraceCmd("edgeworkers","auth",hostname,path.resolve(os.tmpdir(),tempFile));
        const status = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),tempFile),"msg");
        const akamaiEWValue = getAkamaiEWTraceValueFromCLIMsg(status);

        // 120 min auth token validity, we'll cache for 100mins
        authCache.set(hostname, {expiry: Date.now() + (100 * 60 * 1000), auth: akamaiEWValue});
        return akamaiEWValue;
    }catch(e:any){
        throw (`Cannot generate enhanced debug header for hostname: ${hostname}; check that you have permissions to do so with Akamai CLI and try again.`);
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

let stagingIpCache : Map<string, any> =  new Map();
export const getIPAddressForStaging = async function(url:URL):Promise<string>{
    try{
        let hostname = url.hostname;

        let localhost:string[] = [
            '127.0.0.1',
            '0.0.0.0',
            'localhost'
        ]

        if (localhost.includes(hostname)) {
            return '127.0.0.1';
        }

        if (stagingIpCache.has(hostname)) {
            let result = stagingIpCache.get(hostname);
    
            if (result.expiry > Date.now()) {
                return result.ip;
            }
        }

        let edgeHostEndings:string[] = [
            '.edgekey.net',
            '.edgesuite.net',
            '.akamaiedge.net',
            '.akamaized.net'
        ];

        let cname:string = '';
        for (let end of edgeHostEndings) {
            if (hostname.endsWith(end)) {
                // we already have an edge cname input
                cname = hostname;
                break;
            }
        }

        // if we didn't identify a cname above, check DNS
        if (cname === '') {
            cname = await getCNAME(hostname);
        }
        
        const cnameAkamaiStaging = await getStagingCname(cname);
        const ipAddress = await getIPAddress(cnameAkamaiStaging,hostname);

        // we'll cache staging IPs for 15 mins
        stagingIpCache.set(hostname, {expiry: Date.now() + (15 * 60 * 1000), ip: ipAddress});

        return ipAddress;
    }catch(e:any){
        throw e;
    }
};

export const getCNAME = function(hostName:string):Promise<string>{
    return new Promise<string>((resolve, reject) => {
        dns.resolveCname(hostName,(err:any, cnameArr:string[]) => {
          if (err) {
            reject(`Cannot find cname for staging IP lookup for the Host:${hostName} due to - ${err}`);
          }
          resolve(cnameArr[0]);
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

const getHostHeader = function(otherheaders?:string[][]):string|undefined {
    if (typeof otherheaders === 'object') {
        let hostHeader = otherheaders.find((element) => {return element[0].toLowerCase() === 'host'});
        if (hostHeader) {
            return hostHeader[1];
        }
    }
    
    return undefined;
}

export const callCodeProfiler = async function(url:URL,ipAddress:string,ewtrace:string,eventHanler:string,filepath:string,fileName:string,pragmaHeaders?:string,otherheaders?:string[][]):Promise<string>{
    const noEventHandler = `Couldn't generate code profile for provided event handler: ${eventHanler}. Check EdgeWorker code bundle for implemented event handlers.`;
    const agent = new Agent({
        servername: url.hostname,
        rejectUnauthorized: false,
    });
    const headers: { [key: string]: any } = {};

    // only specify the host header if it wasn't provided by user
    let hostHeader:string|undefined = getHostHeader(otherheaders);
    if (!hostHeader) {
        headers.Host = url.hostname;
    }
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
    
    let extractProfileFromBody = function(response:any) {
        let foundJson = '';

        let contentType:string|undefined = response.headers['content-type'];
        if (typeof response.data === 'object') {
            // axios auto deserialized json to string...
            foundJson = JSON.stringify(response.data);
        } else if (contentType && contentType.includes('multipart/form-data')) {
            // extract the boundary
            let boundary = response.headers['content-type'].split('; ')[1].split('boundary=')[1];
            let responseLines:string[] = response.data.split("\r\n");

            let sectionIsProfile = false;
            let recordProfile = false;
            let profileString = '';
            for (const line of responseLines) {

                // this will need to be updated to include memory profile when that's available
                if (line.includes('content-disposition: form-data; name="cpu-profile"') || line.includes('content-disposition: form-data; name="memory-profile"')) { 
                    sectionIsProfile = true;
                } else if (line === '' && sectionIsProfile) {
                    // this is the break between header and body of the section
                    recordProfile = true;
                } else if (recordProfile) {
                    if (line.startsWith('--' + boundary)) {
                        // section is done
                        break;
                    } else {
                        // recording across multiple lines in case profile data is changed to be multi line
                        profileString += line + '\r\n';
                    }
                }
            }

            foundJson = profileString;
        } else if (typeof response.data === 'string') {
            if (isHTML(response.data)){
                throw noEventHandler;
            } else {
                // body is probably the profile
                foundJson = response.data;
            }
        }

        if (foundJson.startsWith('{"nodes')) {
            // smells like a cpu profile, return as such
            return foundJson;
        } else if (foundJson.startsWith('{"head')) {
            // smells like a memory profile, return as such
            return foundJson;
        } else { 
            throw noEventHandler;
        }
    }

    // max 5 attempts in case we get back blank data due to memory profiler bug
    // in most cases the first attempt has good data
    let maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`Attempt ${attempt} to get profile data`);

        let response;
        try {
            response = await axios.get(httpCallString,httpParams);
        } catch(error:any) {
            // axios treats non-200 responses by throwing an exception
            // why is there no way to override this?
            if (error.response) {
                // there may be a usable profile present
                response = error.response;
            } else if (error.request) {
                throw error;
            } else {
                throw (`Falied to generate ${fileName} due to - ${error}`);
            }
        }

        try {
            let profileStringResult = extractProfileFromBody(response);
            if (typeof profileStringResult === 'object') {
                profileStringResult = JSON.stringify(profileStringResult);
            }
            // there is a bug causing empty memory profile to come back in some cases
            // this is usually resolved by re-attempting to get memory profile
            // if this happens we can retry up to 5 times total
            const emptyJson = '{"head":{"callFrame":{"functionName":"(root)","scriptId":"0","url":"","lineNumber":-1,"columnNumber":-1},"selfSize":0,"id":1,"children":[]},"samples":[]}';
            
            if (profileStringResult === '' || profileStringResult === '{}') {
                throw noEventHandler;
            } else if (profileStringResult == emptyJson) {
                // wait 1 sec
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (attempt < maxAttempts - 1) {
                    continue;   // attempt again
                } else {
                    throw ("Profiler came back with no data; please try again");
                }
            } else {
                fs.writeFile(path.resolve(filepath,fileName), profileStringResult, 'utf8', function (err:any) {
                    if (err) {
                        throw err;
                    }
                });
                break;
            }
        } catch(error:any) {
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

export const cnanmeIsStagingCname = function(cname:string):boolean{
    const before_ = cname.substring(0, cname.indexOf(".net"));
    if (before_.endsWith("-staging")) {
        return true;
    }
    return false;
};
