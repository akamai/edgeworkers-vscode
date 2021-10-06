/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as vscode from 'vscode';
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