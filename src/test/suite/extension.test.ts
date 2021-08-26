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
const path = require("path");

suite('testing edgeworker vscode extension', () => {
    it('check if workspace is assigned correctly', function(){
        this.timeout(10000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        console.log(folder);
		assert.ok(!!folder);
		if (folder) {
			let dirpath= path.resolve(__dirname,'../../../src/test/testSpace');
			console.log("the path is "+ dirpath);
            const path1= '/Users/hkambham/edgeworker-code-final-vscode/edgeworker-vscode/edgeworkers-vscode/src/test/testSpace';
            console.log(path1);
			assert.strictEqual(folder, dirpath);
		}
	});
});


