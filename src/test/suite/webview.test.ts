import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import * as sinon from 'sinon';
import { afterEach, before, describe, it } from "mocha";
import * as extension from '../../extension';
import * as akamiCLICalls from '../../akamiCLICalls';
import * as activationUI from '../../activationUI';
import * as vscode from 'vscode';
import * as assert from 'assert';
import * as jsonSample from './sampleTest.json';
import { stringContaining } from 'expect';
import { Utils } from 'vscode-uri';
const path = require("path");
suite('WebView', () => {
    afterEach(function () {
        sinon.restore();
    });
    it('activation output for given valid edgeworker ID name network and version', async function(){
        //should return the true if we try to activate edgeworker id and version in any network ...if they are not present
		this.timeout(100000);
        sinon.stub(akamiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').resolves('');
        const status = await extension.getActivationOutput("6864", "staging",'2.0');
        assert.ok(status.includes("Error activating")=== false);
        });
    it('activation output for given invalid edgeworker ID name network and version', async function(){
        //should pass since when we try to activate the edgeworker id and version that are already in the 
        //any network then we have error saying error activating
        this.timeout(100000);
        const status = await extension.getActivationOutput("6864", "staging",'2.0');
        assert.ok(status.includes("Error activating")===true);
    });
    it('registration edgeworker output for given valid groupID ewName and resource ID', async function(){
        // registration is successfull 
		this.timeout(100000);
        sinon.stub(akamiCLICalls, 'executeAkamaiEdgeWorkerCLICmds').resolves('');
        const status = await extension.getRegisterEWOutput("vscodeTestExtension", "staging",'2.0');
        assert.ok(status.includes("Error registering")=== false);
        });
    it('registration edgeworker output for given invalid groupID ewName and resource ID', async function(){
        //
        this.timeout(100000);
        const status = await extension.getRegisterEWOutput("6864", "staging",'2.0');
        assert.ok(status.includes("Error registering")===true);
    });
});


