/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as sinon from 'sinon';
import { EdgeWorkerDetailsProvider} from '../../managementUI';
import * as jsonSample from './sampleTest.json';
import * as akamaiCLICalls from '../../akamaiCLICalls';
import * as jsonSamplemal from './malfuncJSON.json';

suite('testing Management UI', () => {
    afterEach(function () {
        sinon.restore();
    });
    it('test the json with right JSON in the management UI', async function(){
        this.timeout(100000);
        //check if bundle.tgz is validated
        let obj1 = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve(JSON.stringify(jsonSample.data))}));
        const status = await obj1.getEdgeWorkers();    
        assert.strictEqual(status.length,5);
    });
    it('test the json with empty JSON in the management UI', async function(){
        this.timeout(100000);
        //the empty json should return a 1 dependency as "no versions found"
        const emptyJson = {
            "cliStatus": 0,
            "msg": "sample json",
            "data": []
        };
        let obj1 = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve(JSON.stringify(emptyJson.data))}));
        const status = await obj1.getEdgeWorkers() ;    
        if (status.length ===1){
            status.forEach(element => {
                assert.strictEqual(element.label,"No EdgeWorkers details");
            });
        }    
    });
    it('test the json with wrong data fields in the management UI', async function(){
        this.timeout(100000);
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
        const jsonString = JSON.stringify(malfunctionJson.data);
        
        //the empty json should return a 1 dependency as "no versions found"
        let obj1 = new EdgeWorkerDetailsProvider(new Promise((resolve,reject) => {resolve(jsonString)}));
        
        const status = await obj1.getEdgeWorkers();
        if (status.length ===1){
            status.forEach(element => {
                assert.strictEqual(element.label.toString(),'No EdgeWorker details');
            });
        }
    });
});
