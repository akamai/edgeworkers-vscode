/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from 'sinon';
const chai    = require("chai");
import * as assert from 'assert';
import * as edgeWorkerCommands from '../../edgeWorkerCommands';
import * as akamiCLICalls from '../../akamiCLICalls';
import * as uploadTarBallToSandbox from '../../uploadTarBallToSandbox';
const path = require("path");

suite('testing edgeworker vscode extension', () => {
    let accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
    afterEach(function () {
        sinon.restore();
    });
    it('check if akamai sandbox is not installed and returns error uploadEdgeWorkerTarballToSandbox() return false ', async function(){
        this.timeout(100000);
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
        sinon.stub(akamiCLICalls, 'checkAkamaiSandbox').rejects("error");
        const status = await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(tarFilePath);
        assert.strictEqual(status,false);
    });
    it('getVersionIdFromBundleJSON() should return the version id that is in testspace bundle.json = 0.4', async function(){
        this.timeout(100000);
        let bundleFilePath= path.resolve(__dirname,'../../../src/test/testSpace');
        let version = await uploadTarBallToSandbox.getVersionIdFromBundleJSON(bundleFilePath);
        version = version.toString();
        assert.strictEqual(version,"0.2");
    });
    it('check if the uploadEdgeWorkerTarballToSandbox returns false when executeAkamaiEdgeWorkerCLICmds() return a error', async function(){
        this.timeout(100000);
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
        sinon.stub(akamiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').rejects("error");
        const status = await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(tarFilePath);
        assert.strictEqual(status,false);
    });

    it('check if the uploadEdgeWorkerTarballToSandbox() returns true when akamai sandbox is present and executeAkamaiEdgeWorkerCLICmds() is resolved with output ', async function(){
        //test this case for the account key configured sandbox.
        this.timeout(100000);
        let tarFilePath= path.resolve(__dirname,'../../../src/test/testSpace/bundle.tgz');
        sinon.stub(edgeWorkerCommands, 'getAccountKeyFromUserConfig').returns("B-M-28QYF3M");
        const status = await uploadTarBallToSandbox.uploadEdgeWorkerTarballToSandbox(tarFilePath);
        assert.strictEqual(status,true);
    });

});
