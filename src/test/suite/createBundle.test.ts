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

suite('testing create and validating edge worker', () => { 
    it('creating the bundle', async function(){
        this.timeout(100000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
		try{
			//check if the bundle.tgz is created
			const status = await checkCreateEdgeWorkerBundle(folder);
			assert.strictEqual(status,"bundle");
		}catch(e){
			assert.strictEqual(e,true);
		}
	});
	it('validating the bundle', async function(){
        this.timeout(100000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
		try{
			//check if bundle.tgz is validated
			const status = await checkValidateEdgeWorkerBundle(folder,"bundle");
			assert.strictEqual(status,true);
		}catch(e){
			assert.strictEqual(e,true);
		}
	});
});

//checking the creation of the bundle
export const checkCreateEdgeWorkerBundle = async function(folder:string):Promise<boolean|string>{
	return new Promise(async (resolve, reject) => {
	try{
			const staus = await edgeWorkerCommands.createEdgeWorkerBundle(folder);
			resolve(staus);
		}catch(e){
			reject(false);
		}
	});
};

//checking the validation of the bundle
export const checkValidateEdgeWorkerBundle = async function(folder:string,tarFilename:string):Promise<boolean>{
	return new Promise(async (resolve, reject) => {	
	try{
			const staus = await edgeWorkerCommands.validateEdgeWorkerBundle(folder,tarFilename);
			resolve(true);
		}catch(e){
			reject(false);
		}
	});
};
