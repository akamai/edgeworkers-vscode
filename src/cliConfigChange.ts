/* eslint-disable @typescript-eslint/naming-convention */
import * as edgeWorkerCommands from './edgeWorkerCommands';
const ConfigParser = require('configparser');
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const setAkamaiCLIConfig = async function():Promise<boolean>{
    const cliStatistics = edgeWorkerCommands.getCLIStatisticsEnable();
    const cliUpdateCheck = edgeWorkerCommands.getCLIUpdateCheckEnable();
    const config = new ConfigParser();
    const configPath = path.resolve(os.homedir(),".akamai-cli","config");
    if(fs.existsSync(configPath)){
        config.read(configPath);
        config.set('cli', 'last-upgrade-check','ignore');
        config.set('cli', 'enable-cli-statistics',false);
        config.write(configPath);
        return true;
    }
    else{
        return false;
    }
};

export const checkAkamaiConfig = async function():Promise<string[]>{
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
    return cmd;
};


