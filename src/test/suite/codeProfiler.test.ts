/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as sinon from 'sinon';
import { CodeProfilerTerminal} from '../../codeProfilerUI';
import * as jsonSample from './sampleTest.json';
import * as akamaiCLICalls from '../../akamaiCLICalls';
import * as jsonSamplemal from './malfuncJSON.json';
import * as codeProfiler from '../../codeProfilerFunction';
import { expect } from "chai";
import { URL } from "url";




suite('testing code profiler UI ---------------------', () => {
    afterEach(function () {
        sinon.restore();
    });
    it('test callCodeProfiler --- return error when the invalid URL is provided', async function(){
        this.timeout(100000);
        sinon.stub(codeProfiler, 'checkURLifValid').throws("Failed to run code profiler due to url invalid");
        await codeProfiler.getCodeProfilerFile('/users/hkambham','sample','http://www.mofroyo.co/us/en/?random=$RANDOM','x-ew-code-profile-onclientresponse','',[]).catch(e => assert.ok(e,'Failed to run code profiler due to url invalid'));
    });
    it('test callCodeProfiler --- return error when error is generted during getting ewTrace', async function(){
        this.timeout(100000);
        sinon.stub(codeProfiler, 'codeProfilerEWTrace').throws("Failed to run code profiler due to ewtrace failure");
        try{
            await codeProfiler.getCodeProfilerFile('/users/hkambham','sample','http://www.mofroyo.co/us/en/?random=$RANDOM','x-ew-code-profile-onclientresponse','',[]);
        }catch(err:any){
            assert.match(err.toString(), /Error:/);
        }
    });
    it('test callCodeProfiler, test getIpAddress for the www.mofroyo.co cname should return error with invalid cnameakamai', async function(){
        this.timeout(100000);
           const cnameAkamai = "fake-staging.net";
        try{
            await codeProfiler.getIPAddress(cnameAkamai,"www.mofroyo.co");
        }catch(err:any){
            assert.match(err.toString(), /Falied to get IP address for the host/); 
        }
    });
    it('test callCodeProfiler, test getIpAddress for the www.mofroyo.co cname should return valid ipadress', async function(){
        this.timeout(100000);
           const cnameAkamai = "e17322.dsca.akamaiedge-staging.net";
            const ipaddress = await codeProfiler.getIPAddress(cnameAkamai,"www.mofroyo.co");
            assert.strictEqual(ipaddress,"23.193.6.69");
    });

    it('test callCodeProfiler, test getIpAddress for the www.mofroyo.co cname should return error with invalid cnameakamai', async function(){
        this.timeout(100000);
           const cnameAkamai = "fake-staging.net";
        try{
            await codeProfiler.getIPAddress(cnameAkamai,"www.mofroyo.co");
        }catch(err:any){
            assert.match(err.toString(), /Falied to get IP address for the host/); 
        }
    });
    it('test callCodeProfiler, test cname for the www.mofroyo.co cname should return valid cname', async function(){
        this.timeout(100000);
           const cnameAkamai = "e17322.dsca.akamaiedge-staging.net";
            const ipaddress = await codeProfiler.getIPAddress(cnameAkamai,"www.mofroyo.co");
            assert.strictEqual(ipaddress,"23.193.6.69");
    });
    it('test callCodeProfiler, test codeProfilerEWTrace  should return error', async function(){
        this.timeout(100000);
        sinon.stub(akamaiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').returns(Promise.reject(new Error("error in ewTrace commad")));
        const urlObject = new URL("http://www.mofroyo.co/us/en/?random=$RANDOM");
        const ewTrace = await codeProfiler.codeProfilerEWTrace(urlObject).catch(e => assert.ok(e,'error in ewTrace commad'));
    });
    it('test callCodeProfiler, test callCodeProfiler  should return error when invalid trace is provided', async function(){
        this.timeout(100000);
        sinon.stub(akamaiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').returns(Promise.reject(new Error("error in ewTrace commad")));
        const urlObject = new URL("http://www.mofroyo.co/us/en/?random=$RANDOM");
        const ewTrace = await codeProfiler.codeProfilerEWTrace(urlObject).catch(e => assert.ok(e,'error in ewTrace commad'));
    });
    it('test if the cname already is staging', async function(){
        this.timeout(100000);
        const check = await codeProfiler.cnanmeIsStagingCname("mofroyo.edgekey-staging.net");
        assert.strictEqual(check,true);
    });
    it('test callCodeProfiler, test if the cname already not staging', async function(){
        this.timeout(100000);
        const check = await codeProfiler.cnanmeIsStagingCname("mofroyo.edgekey.net");
        assert.strictEqual(check,false);
    });
    it('test if the cnmae is generated successfully 2 didg commands on hostname will be the result', async function(){
        this.timeout(100000);
        const cname = await codeProfiler.cnameLookup("www.mofroyo.co");
        assert.strictEqual(cname,"e17322.dsca.akamaiedge.net");
    });
    it('test callCodeProfiler, test if the cnmae is generated successfully- get this cname just with one dig comamnd', async function(){
        this.timeout(100000);
        const cname = await codeProfiler.cnameLookup("stage.mofroyo.co");
        assert.strictEqual(cname,"mofroyo.edgekey-staging.net");
    });
});
