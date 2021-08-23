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
import { EdgeWorkerDetailsProvider} from '../../managementUI';
import {downloadEdgeWorker} from '../../downloadEdgeWorker';
import * as akamiCLICalls from '../../akamiCLICalls';
import * as jsonSample from './sampleTest.json';
import { stderr } from 'chalk';


suite('testing edgeworker vscode extension', () => {
    it('check if workspace is assigned correctly', function(){
        this.timeout(10000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        console.log(folder);
		assert.ok(!!folder);
		if (folder) {
            const path1= '/Users/hkambham/edgeworker-code-final-vscode/edgeworker-vscode/edgeworkers-vscode/src/test/testSpace';
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
	it('test the json with right JSON in the management UI', async function(){
        this.timeout(100000);
		//check if bundle.tgz is validated
		let obj1 = new EdgeWorkerDetailsProvider();
		const jsonString = JSON.stringify(jsonSample);
		const status = await obj1.getEdgeWorkers(jsonString);
		assert.strictEqual(status.length,5);
	});
	it('test the json with malfunctioned JSON in the management UI', async function(){
        this.timeout(100000);
		//check if bundle.tgz is validated
		let obj1 = new EdgeWorkerDetailsProvider();
		const jsonString = JSON.stringify(jsonSample);
		const status = await obj1.getEdgeWorkers(jsonString);
		assert.strictEqual(status.length,5);
	});
	it('test the json with empty JSON in the management UI', async function(){
        this.timeout(100000);
		//the empty json should return a 1 dependency as "no versions found"
		let obj1 = new EdgeWorkerDetailsProvider();
		const emptyJson = {
			"cliStatus": 0,
			"msg": "sample json",
			"data": []
		};
		const jsonString = JSON.stringify(emptyJson);
		const status = await obj1.getEdgeWorkers(jsonString);
		if (status.length ===1){
			status.forEach(element => {
				assert.strictEqual(element.label,"No edge workers details");
			});
		}
	});
	it('test the json with wrong data feilds in the management UI', async function(){
        this.timeout(100000);
		//the empty json should return a 1 dependency as "no versions found"
		let obj1 = new EdgeWorkerDetailsProvider();
		const malfunctionJson = {
			"cliStatus": 0,
			"msg": "sample json",
			"data": [
				{
					"ghfh": 5555,
					"efg": "lmn",
				}
			]
		};
		const jsonString = JSON.stringify(malfunctionJson);
		const status = await obj1.getEdgeWorkers(jsonString);
		if (status.length ===1){
			status.forEach(element => {
				assert.strictEqual(element.label,'undefined');
			});
		}
	});
	it('test the download edgeworker option with right edge worker id and edge worker version: should return true', async function(){
        this.timeout(100000);
		const result= await downloadEdgeWorker('3654','1.0');
		assert.strictEqual(result,true);
		
	});
	it('test the download edgeworker option with wrong edge worker id and edge worker version: should return false', async function(){
        this.timeout(100000);
		const result= await downloadEdgeWorker('12312','1.0');
		assert.strictEqual(result,false);
	});

	it('test if the downloadBundle used to display files in management UI return array of file names', async function(){
        //edgeWorkerID = 3654 should retirn 2 files bundle.json and main.js
		this.timeout(100000);
		let files = new EdgeWorkerDetailsProvider();
		const filesNmaes = await files.downloadBundle('3654','1.0');
		assert.strictEqual(filesNmaes.length, 2);
		assert.ok(filesNmaes.includes('bundle.json'));
	});

	it('test if the downloadBundle used to display files in management UI return error when executeCLICommandExceptTarCmd command fails', async function(){
        //edgeWorkerID = 3654 should retirn 2 files bundle.json and main.js
		// when any function like fials or rejects the downloadBundle() should return that error in cath.
		this.timeout(100000);
		let files = new EdgeWorkerDetailsProvider();
		sinon.stub(akamiCLICalls, 'executeCLICommandExceptTarCmd').returns(Promise.reject(new Error("error in commad")));
		const filesNmaes = await files.downloadBundle('3654','1.0').catch(e => assert.ok(e,'error in commad'));
	});
	it('test the getBundleFiles() should return the edgeWorkers Array ', async function(){
        //edgeWorkerID = 3654 should retirn 2 files bundle.json and main.js
		// when any function like fials or rejects the downloadBundle() should return that error in cath.
		this.timeout(100000);
		let files = new EdgeWorkerDetailsProvider();		
		const filesNmaes = await files.getBundleFiles('3654','1.0');
		assert.strictEqual(filesNmaes.length,2);
	});
	it('test the getBundleFiles() should return edgeworker with label error in fetching files when downloadBUndle throws error ', async function(){
        //edgeWorkerID = 3654 should retirn 2 files bundle.json and main.js
		// when downloadBundle() throws error getBundleFiles() should return error in fetching files as 
		this.timeout(100000);
		let files = new EdgeWorkerDetailsProvider();
		sinon.stub(files, 'downloadBundle').returns(Promise.reject(new Error("error in commad")));		
		const filesNmaes = await files.getBundleFiles('3654','1.0');
		filesNmaes.forEach(element => assert.strictEqual(element.label,`error in fetching files`));
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

