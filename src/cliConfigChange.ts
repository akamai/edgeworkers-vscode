/* eslint-disable @typescript-eslint/naming-convention */
import * as edgeWorkerCommands from './edgeWorkerCommands';
const ConfigParser = require('configparser');
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const setAkamaiCLIConfig = function(configPath:string):boolean{
    const config = new ConfigParser();
        try{
            config.read(configPath);
            const value = config.get('cli', 'last-upgrade-check');
            config.write(configPath);
            if(typeof(value) === 'undefined' || value === '' || value !== 'ignore'){
                config.set('cli', 'last-upgrade-check','ignore');
                config.write(configPath);
            }
            return true;
        }catch(e:any){
            throw Error (`Cannot set the config attribute "last-upgrade-check = ignore" at config path: ${configPath} due to - ${e.toString()}. You can manually set the attribute " last-upgrade-check = ignore " at ${configPath}.`);
        }
};
export const  getDifference = function(a: string[], b: string[]): string[] {
    return a.filter((element) => {
      return !b.includes(element);
    });
};
export const  readToArrayListFromFile = function(configFilepath: string): string[] {
    const stringConfig = fs.readFileSync(configFilepath, 'utf-8');
    let arrayStrings:string[] = [];
    let j = 0;
    stringConfig.split(/\r?\n/).forEach((line)=>{
        arrayStrings[j] = line.trim().replace(/\s/g,'');
        j++;
    });
    return arrayStrings;
};
export const fileCopy = function(srcFilePath:string, dstFilePath:string){
    try{
        //incase sometimes the config file has the red only we are changing the file permissions.
        fs.chmodSync(dstFilePath, 0o755); 
        fs.copyFileSync(srcFilePath, dstFilePath);
    }catch(err:any){
        throw Error(`Failed to copy the contents of file from : ${srcFilePath} to : ${dstFilePath} due to - ${err.toString()}`);
    }
};

export const writeConfig = async function(){
    try{
        const configPath = path.resolve(os.homedir(),".akamai-cli","config");
        const configPathOld = path.resolve(os.homedir(),".akamai-cli","config_old");
        if(fs.existsSync(configPath)){
            fs.copyFileSync(configPath,configPathOld);
            const arrayStringBeforeConfigAdd = readToArrayListFromFile(configPath);
            if(setAkamaiCLIConfig(configPath)){
                const arrayStringAfterConfigAdd = readToArrayListFromFile(configPath);
                //we do this becasue if some time the old array has more or vceversa this will finally give us the diff properly
                const diff = getDifference(arrayStringAfterConfigAdd,arrayStringBeforeConfigAdd);
                console.log("diff is" + diff);
                if(!(diff.length === 0 || (diff.length ===1 && diff[0] === 'last-upgrade-check=ignore')))
                {
                    vscode.window.showErrorMessage(`Failed to Modify the akamai config file at ${configPath}. Add attribute "last-upgrade-check = ignore" to config file at ${configPath} manually.`);
                    fs.copyFileSync(configPathOld, configPath);
                }
            }
        }
        else{
            throw Error(`Config File path:${configPath} not found. Make sure the akamai cli config at ${configPath} is set properly and also add attribute "last-upgrade-check = ignore" at ${configPath} to keep the akamai cli working.`) ;
        }
    }catch(err:any){
        throw err.toString();
    }
};

export const checkAkamaiConfig = function():string[]{
    let cmd = [];
    let accountkey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    let section = edgeWorkerCommands.getSectionNameFromUserConfig();
    let edgerc = edgeWorkerCommands.getEdgercFilePathFromUserConfig();
    if(edgerc !== null && edgerc !== '' && edgerc !== undefined){
        if(fs.existsSync(edgerc) === false){
            throw new Error(`Invalid .edgerc file path in user settings - ${edgerc}`);
        }
        else{
            cmd.push("--edgerc",`${edgerc}`);
        }
    }
    if(section !== null && section !== '' && section!== undefined){
        section= section.trim();
        cmd.push("--section",`${section}`);
    }
    if(accountkey !== null && accountkey !== ''&& accountkey !== undefined){
        accountkey= accountkey.trim();
        cmd.push("--accountkey",`${accountkey}`);
    }
    cmd.push("--ideExtension","VSCODE");
    return cmd;
};


