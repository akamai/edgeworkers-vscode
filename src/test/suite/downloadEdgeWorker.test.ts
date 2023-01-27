/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from 'sinon';
import * as assert from 'assert';
import { EdgeWorkerDetailsProvider} from '../../managementUI';
import {downloadEdgeWorker} from '../../downloadEdgeWorker';
import * as akamaiCLICalls from '../../akamaiCLICalls';

suite('testing Downloading EdgeWorker', () => {
    afterEach(function () {
        sinon.restore();
    });
    it('test the download edgeworker option with right EdgeWorker id and EdgeWorker version: should return true', async function(){
        this.timeout(100000);
        const result= await downloadEdgeWorker('3654','1.0');
        assert.strictEqual(result,true);
        
    });
    it('test the download edgeworker option with wrong EdgeWorker id and EdgeWorker version: should return false', async function(){
        this.timeout(100000);
        const result= await downloadEdgeWorker('12312','1.0');
        assert.strictEqual(result,false);
    });

    it('test if the downloadBundle used to display files in management UI return array of file names', async function(){
        //edgeWorkerId = 3654 should retirn 2 files bundle.json and main.js
        this.timeout(100000);
        let files = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve('')}));
        const filesNmaes = await files.downloadBundle('3654','1.0');
        assert.strictEqual(filesNmaes.length, 2);
        assert.ok(filesNmaes.includes('bundle.json'));
    });

    it('test if the downloadBundle used to display files in management UI return error when executeAkamaiEdgeWorkerCLICmds command fails', async function(){
        //edgeWorkerId = 3654 should retirn 2 files bundle.json and main.js
        // when any function like fials or rejects the downloadBundle() should return that error in cath.
        this.timeout(100000);
        let files = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve('')}));
        sinon.stub(akamaiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').returns(Promise.reject(new Error("error in tar commad")));
        const filesNmaes = await files.downloadBundle('3654','1.0').catch(e => assert.ok(e,'error in commad'));
    });
    it('test the getBundleFiles() should return the edgeWorkers Array ', async function(){
        //edgeWorkerId = 3654 should retirn 2 files bundle.json and main.js
        // when any function like fials or rejects the downloadBundle() should return that error in cath.
        this.timeout(100000);
        let files = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve('')}));        
        const filesNmaes = await files.getBundleFiles('3654','1.0');
        assert.strictEqual(filesNmaes.length,2);
    });
    it('test the getBundleFiles() should return edgeworker with label error fetching bundle contents files when downloadBUndle throws error ', async function(){
        //edgeWorkerId = 3654 should retirn 2 files bundle.json and main.js
        // when downloadBundle() throws error getBundleFiles() should return error fetching bundle contents files as 
        this.timeout(100000);
        let files = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve('')}));
        sinon.stub(files, 'downloadBundle').returns(Promise.reject(new Error("error in commad")));        
        const filesNmaes = await files.getBundleFiles('3654','1.0');
        filesNmaes.forEach(element => assert.strictEqual(element.label,`error fetching bundle contents`));
    });
});