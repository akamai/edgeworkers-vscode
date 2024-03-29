/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from 'sinon';
const chai    = require("chai");
import * as assert from 'assert';
import * as edgeWorkerCommands from '../../edgeWorkerCommands';
import * as uploadEdgeWorkerVersion from '../../uploadEdgeWorker';
import * as akamaiCLICalls from '../../akamaiCLICalls';
import * as jsonSample from './sampleTest.json';
const path = require("path");

suite('testing edgeworker vscode extension', () => {
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    afterEach(function () {
        sinon.restore();
    });
    it('check if the edgeWorker is present under the user account', async function(){
        //EdgeWorker ID : 3333 is present in sample.json
        this.timeout(100000);
        const ListIds = JSON.stringify(jsonSample.data);
        sinon.stub(akamaiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').resolves(ListIds);
        const status:any = await uploadEdgeWorkerVersion.validateEgdeWorkerID('3333').then((success)=>{
            assert.strictEqual(success,true);
        });
    });
    it('check if the present EdgeWorker 3654 and present version 2.0 allows to upload same bundle', async function(){
        //EdgeWorker ID 3654: when user tries to upload same bundle it fails since the bundle is already present
        //should return the error
        this.timeout(100000);
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
        let edgeWorkerId:string = "";
        const status:any = await uploadEdgeWorkerVersion.uploadEdgeWorker(tarFilePath,edgeWorkerId);
        assert.strictEqual(status.toString(),'false');
        });
    it('check if upload bundle is successfull', async function(){
        //should return the true since it is done
        this.timeout(100000);
        sinon.stub(uploadEdgeWorkerVersion, 'validateEgdeWorkerID').resolves(true);
        sinon.stub(akamaiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').resolves('');
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
        let edgeWorkerId:string = "";
        const status:any = await uploadEdgeWorkerVersion.uploadEdgeWorker(tarFilePath,edgeWorkerId);
        assert.strictEqual(status.toString(),'true');
        });
});