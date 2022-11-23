/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as akamaiCLICalls from '../../akamaiCLICalls';
import * as cliConfigChange from '../../cliConfigChange';
import * as jsonSample from './sampleTest.json';

suite('testing create and validating EdgeWorker', () => { 
    afterEach(function () {
        sinon.restore();
    });
    it('checking Akamai CLI is installed or not', async function(){
        this.timeout(100000);
        const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
            //check id akamai CLI is installed on user system
        const status= await akamaiCLICalls.isAkamaiCLIInstalled();
        assert.strictEqual(status,true);
    });
    it('test writeConfig() function if it throws error when the file copy fails', async function(){
        this.timeout(100000);
        sinon.stub(cliConfigChange, 'fileCopy').throws("Failed to copy the contents of file");
        try{
            await cliConfigChange.writeConfig();
        }catch(err:any){
            assert.match(err.toString(), /Failed to copy the contents of file/);
        }
    });
    it('test writeConfig() function if it throws error when set setAkamaiCLIConfig throws error', async function(){
        this.timeout(100000);
        sinon.stub(cliConfigChange, 'setAkamaiCLIConfig').throws("Failed to set config attributes");
        try{
            await cliConfigChange.writeConfig();
        }catch(err:any){
            assert.match(err.toString(), /Failed to set config attributes/);
        }
    });
    it('test if checkEnvBeforeEachCommand() when getDifference() function returns empty which means no difference ', async function(){
        this.timeout(100000);
        sinon.stub(cliConfigChange, 'getDifference').returns([]);
            assert.strictEqual('done',await akamaiCLICalls.checkEnvBeforeEachCommand());
    });
});

