/* eslint-disable @typescript-eslint/naming-convention */
import { Console } from 'console';
import { afterEach, beforeEach, describe, it } from "mocha";
import { expect } from "chai";
import * as sinon from 'sinon';
import * as nodeDependencies from '../../managementUI';
const chai    = require("chai");
import * as assert from 'assert';
const spies = require('chai-spies');
chai.use(spies);
import {workspace}from 'vscode';
import { join } from 'path';
import * as vscode from 'vscode';
import * as edgeWorkerCommands from '../../edgeWorkerCommands';
import { EdgeWorkerDetailsProvider, Dependency } from '../../managementUI';
import * as jsonSample from './sampleTest.json';


suite('testing edgeworker vscode extension', () => {
    it('check if workspace is assigned correctly', function(){
        this.timeout(10000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        console.log(folder);
		assert.ok(!!folder);
		if (folder) {
            const path1= '/Users/hkambham/edgeworkers-vscode/src/test/testSpace';
            console.log(path1);
			assert.strictEqual(folder, path1);
		}
	});
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
	// it('what happenes when account key is not present and present', async function(){
    //     this.timeout(100000);
	// 	const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
	// 	try{
	// 		//check if bundle.tgz is validated
	// 		const status = await checkValidateEdgeWorkerBundle(folder,"bundle");
	// 		assert.strictEqual(status,true);
	// 	}catch(e){
	// 		assert.strictEqual(e,true);
	// 	}
	// });

	it('test the json with right JSON in the management UI', async function(){
        this.timeout(100000);
			//check if bundle.tgz is validated
			let obj1 = new EdgeWorkerDetailsProvider('B-C-BR0JK9');
			const jsonString = JSON.stringify(jsonSample);
			const status = await obj1.getEdgeWorkers(jsonString);
			assert.strictEqual(status.length,5);
	});

	it('test the json with malfunctioned JSON in the management UI', async function(){
        this.timeout(100000);
			//check if bundle.tgz is validated
			let obj1 = new EdgeWorkerDetailsProvider('B-C-BR0JK9');
			const jsonString = JSON.stringify(jsonSample);
			const status = await obj1.getEdgeWorkers(jsonString);
			assert.strictEqual(status.length,5);
	});


	it('test the json with empty JSON in the management UI', async function(){
        this.timeout(100000);
			//the empty json should return a 1 dependency as "no versions found"
			let obj1 = new EdgeWorkerDetailsProvider('B-C-BR0JK9');
			const emptyJson = {
				"cliStatus": 0,
				"msg": "sample json",
				"data": []
			};
			const jsonString = JSON.stringify(emptyJson);
			const status = await obj1.getEdgeWorkers(jsonString);
			if (status.length ===1){
				status.forEach(element => {
					assert.strictEqual(element.label,"No edge workers");
				});
			}
	});

	it('test the json with wrong data feilds in the management UI', async function(){
        this.timeout(100000);
			//the empty json should return a 1 dependency as "no versions found"
			let obj1 = new EdgeWorkerDetailsProvider('B-C-BR0JK9');
			const emptyJson = {
				"cliStatus": 0,
				"msg": "sample json",
				"data": [
					{
						"abc": 5555,
						"efg": "lmn",
					  }
				]
			};
			const jsonString = JSON.stringify(emptyJson);
			const status = await obj1.getEdgeWorkers(jsonString);
			if (status.length ===1){
				status.forEach(element => {
					assert.strictEqual(element.label,"No edge workers");
				});
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

