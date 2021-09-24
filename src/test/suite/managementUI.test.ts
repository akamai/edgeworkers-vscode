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

suite('testing Management UI', () => {
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
				assert.strictEqual(element.label,"No EdgeWorkers details");
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
});
