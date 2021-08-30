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
import * as uploadEdgeWorkerVersion from '../../uploadEdgeWorker';
import * as akamiCLICalls from '../../akamiCLICalls';
import * as jsonSample from './sampleTest.json';
const path = require("path");

suite('testing edgeworker vscode extension', () => {
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    afterEach(function () {
        sinon.restore();
    });
    it('check if the edgeWorker is present under the user account', async function(){
        //EdgeWorker ID : 3654 is present under the user account
		this.timeout(100000);
		const status:any = await uploadEdgeWorkerVersion.validateEgdeWorkerID('3654',accountKey).then((success)=>{
            assert.strictEqual(success,true);
        });
	});
    it('check if the present edge worker 3654 and present version 2.0 allows to upload same bundle', async function(){
        //EdgeWorker ID 3654: when user tries to upload same bundle it fails since the bundle is already present
        //should return the error
		this.timeout(100000);
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
		const status:any = await uploadEdgeWorkerVersion.uploadEdgeWorker(tarFilePath);
        assert.strictEqual(status.toString(),'false');
        });
    it('check if upload bundle is successfull', async function(){
        //EdgeWorker ID: which is present in  6539 version 0.3 account of ***REMOVED***
        //should return the error
		this.timeout(100000);
        sinon.stub(edgeWorkerCommands, 'getAccountKeyFromUserConfig').returns('***REMOVED***');
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
		const status:any = await uploadEdgeWorkerVersion.uploadEdgeWorker(tarFilePath);
        assert.strictEqual(status.toString(),'true');
        });
});