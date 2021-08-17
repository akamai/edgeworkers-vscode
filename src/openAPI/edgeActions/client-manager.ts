/* file from cli-edgeworkers repo*/
import * as cliUtils from '../utils/cli-utils';
import * as os from 'os';
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const untildify = require('untildify');
const sha256File = require('sha256-file');

const CLI_CACHE_PATH: string = process.env.AKAMAI_CLI_CACHE_DIR || process.env.AKAMAI_CLI_CACHE_PATH || path.resolve(os.homedir(), '.akamai-cli/cache');
const EDGEWORKERS_CLI_HOME: string = path.join(CLI_CACHE_PATH, '/edgeworkers-cli/');
const EDGEWORKERS_DIR: string = path.join(EDGEWORKERS_CLI_HOME, '/edgeworkers/');
const EDGEWORKERS_CLI_OUTPUT_DIR: string = path.join(EDGEWORKERS_DIR, `/cli-output/${Date.now()}/`);
const EDGEWORKERS_CLI_OUTPUT_FILENAME: string = 'ewcli_output.json';


// set default JSON output options
const jsonOutputParams = {
  jsonOutput: false,
  jsonOutputPath: EDGEWORKERS_CLI_OUTPUT_DIR,
  jsonOutputFilename: EDGEWORKERS_CLI_OUTPUT_FILENAME
};

// Add try/catch logic incase user doesnt have permissions to write directories needed
try {
  if (!fs.existsSync(EDGEWORKERS_CLI_HOME)) {
    fs.mkdirSync(EDGEWORKERS_CLI_HOME, { recursive: true });
  }
}
catch(e) {
  cliUtils.logAndExit(1, `ERROR: Cannot create ${EDGEWORKERS_CLI_HOME}\n${e.message}`);
}

try {
  if (!fs.existsSync(EDGEWORKERS_DIR)) {
    fs.mkdirSync(EDGEWORKERS_DIR, { recursive: true });
  }
}
catch(e) {
  cliUtils.logAndExit(1, `ERROR: Cannot create ${EDGEWORKERS_DIR}\n${e.message}`);
}

export function setJSONOutputMode(output: boolean) {
  jsonOutputParams.jsonOutput = output;
}

export function setJSONOutputPath(path: string) {
  // only set path to new value if it is provided; since its optional, could be null, so leave set to default value
  if(path){jsonOutputParams.jsonOutputPath = untildify(path);}
    
}


export function determineTarballDownloadDir(ewId: string, rawDownloadPath: string) {

    // If download path option provided, try to use it
    // If not provided, default to CLI cache directory under <CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/<ewid>/
    var downloadPath = !!rawDownloadPath ? untildify(rawDownloadPath) : createEdgeWorkerIdDir(ewId);
  
    // Regardless of what was picked, make sure it exists - if it doesnt, attempt to create it
    // Add try/catch logic incase user doesnt have permissions to write directories needed
    try {
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }
    }
    catch(e) {
      cliUtils.logAndExit(1, `ERROR: Cannot create ${downloadPath}\n${e.message}`);
    }
    console.log(`Saving downloaded bundle file at: ${downloadPath}`);
    return downloadPath;
  }
  
  function determineJSONOutputPathAndFilename() {
    // If JSON output path option provided, try to use it
    // If not provided, default to CLI cache directory under <CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/cli-output/<Date.now()>/
    let jsonOutputPath = jsonOutputParams.jsonOutputPath;
    let jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
  
    // check to see if path is an existing directory location, if it is not, collect directory name and filename via path
    if (fs.existsSync(jsonOutputPath)) {
  
      if(fs.lstatSync(jsonOutputPath).isDirectory()) {
        //leave path alone, but set filename to default
        jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
      }
      else {
        jsonOutputFilename = path.basename(jsonOutputParams.jsonOutputPath);
        jsonOutputPath = path.dirname(jsonOutputParams.jsonOutputPath);
      }
    }
    else {
      // if path doesnt exist and its not the default path, break custom path into directory and path
      if (jsonOutputPath !== EDGEWORKERS_CLI_OUTPUT_DIR) {
        // if path ends with slash, assume user wants it to be a directory, not a filename
        if (jsonOutputPath.endsWith('/')) {
          // leave path alone, but set filename to default
          jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
        }
        else {
          jsonOutputFilename = path.basename(jsonOutputParams.jsonOutputPath);
          jsonOutputPath = path.dirname(jsonOutputParams.jsonOutputPath);
        }
      }
    }
  
    // Regardless of what was picked, make sure it exists - if it doesnt, attempt to create it
    // Add try/catch logic incase user doesnt have permissions to write directories needed
    try {
      if (!fs.existsSync(jsonOutputPath)) {
        fs.mkdirSync(jsonOutputPath, { recursive: true });
      }
    }
    catch(e) {
      cliUtils.logAndExit(1, `ERROR: Cannot create ${jsonOutputPath}\n${e.message}`);
    }
  
    console.log(`Saving JSON output at: ${path.join(jsonOutputPath, jsonOutputFilename)}`);
    return {
      path: jsonOutputPath,
      filename: jsonOutputFilename
    }
  }
  export function isJSONOutputMode() {
    return jsonOutputParams.jsonOutput;
  }

  export function writeJSONOutput(exitCode: number, msg: string, data = {}) {

    // First, build the JSON object
    let outputMsg: string;
    let outputData;
  
    // Check if msg is already JSON - which would happen if OPEN API response failed for some reason
    if(cliUtils.isJSON(msg)) {
      outputMsg = 'An OPEN API error has occurred!';
      outputData = [JSON.parse(msg)];
    }
    else {
      outputMsg = msg;
      outputData = data
    }
  
    let output = {
      cliStatus: exitCode,
      msg: outputMsg,
      data: outputData
    };
  
    // Then, determine the path and filename to write the JSON output
    let outputDestination = determineJSONOutputPathAndFilename();
    // Last, try to write the output file synchronously
    try {
      fs.writeFileSync(path.join(outputDestination.path, outputDestination.filename), cliUtils.toJsonPretty(output));
    }
    catch(e) {
      // unset JSON mode since we cant write the file before writing out error
      setJSONOutputMode(false);
      cliUtils.logAndExit(1, `ERROR: Cannot create JSON output \n${e.message}`);
    }
  }
  function createEdgeWorkerIdDir(ewId: string) {
    const edgeWorkersDir = path.join(EDGEWORKERS_DIR, ewId);
  
    // Add try/catch logic incase user doesnt have permissions to write directories needed
    try {
      if (!fs.existsSync(edgeWorkersDir))
        fs.mkdirSync(edgeWorkersDir, { recursive: true });
  
      return edgeWorkersDir;
    }
    catch(e) {
      cliUtils.logAndExit(1, `ERROR: Cannot create ${edgeWorkersDir}\n${e.message}`);
    }
  }
