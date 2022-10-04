/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as edgeWorkerCommands from '../../edgeWorkerCommands';

suite('testing create and validating EdgeWorker', () => { 
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
