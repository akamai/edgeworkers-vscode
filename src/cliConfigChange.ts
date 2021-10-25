/* eslint-disable @typescript-eslint/naming-convention */
import * as edgeWorkerCommands from './edgeWorkerCommands';
const ConfigParser = require('configparser');
const os = require('os');
const fs = require('fs');
const path = require('path');

export const setAkamaiCLIConfig = async function():Promise<boolean>{
    const cliStatistics = edgeWorkerCommands.getCLIStatisticsEnable();
    const cliUpdateCheck = edgeWorkerCommands.getCLIUpdateCheckEnable();
    const config = new ConfigParser();
    // const configPath = path.resolve(os.homedir(),".akamai-cli","config");
    const configPath = path.resolve('/Users/hkambham',"hemaconfig");
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

