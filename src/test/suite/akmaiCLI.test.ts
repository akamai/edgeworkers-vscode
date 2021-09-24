/* eslint-disable @typescript-eslint/naming-convention */
import { Console } from 'console';
import { afterEach, beforeEach, describe, it } from "mocha";
import { expect } from "chai";
import * as sinon from 'sinon';
import * as nodeDependencies from '../../managementUI';
const chai    = require("chai");
import * as assert from 'assert';
const spies = require('chai-spies');
import {workspace}from 'vscode';
import { join } from 'path';
import * as vscode from 'vscode';
import * as edgeWorkerCommands from '../../edgeWorkerCommands';
import { EdgeWorkerDetailsProvider} from '../../managementUI';
import {downloadEdgeWorker} from '../../downloadEdgeWorker';
import * as akamiCLICalls from '../../akamiCLICalls';
import * as jsonSample from './sampleTest.json';

suite('testing create and validating EdgeWorker', () => { 
    it('checking Akamai CLI is installed or not', async function(){
        this.timeout(100000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
			//check id akamai CLI is installed on user system
        const status= await akamiCLICalls.isAkamaiCLIInstalled();
        assert.strictEqual(status,true);
    });
});