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
    const disposables: vscode.Disposable[] = [];
    const webviewId = 'myWebview';

	function _register<T extends vscode.Disposable>(disposable: T) {
		disposables.push(disposable);
		return disposable;
	}

	teardown(async () => {
		await closeAllEditors();

		disposeAll(disposables);
	});
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
	it('webviews should be able to send and receive messages', async function(){
        this.timeout(100000);
		const webview = _register(vscode.window.createWebviewPanel(webviewId, 'title', { viewColumn: vscode.ViewColumn.One }, { enableScripts: true }));
		const firstResponse = getMesssage(webview);
		webview.webview.html = createHtmlDocumentWithBody(/*html*/`
			<script>
				const vscode = acquireVsCodeApi();
				window.addEventListener('message', (message) => {
					vscode.postMessage({ value: message.data.value + 1 });
				});
			</script>`);

		webview.webview.postMessage({ value: 1 });
		assert.strictEqual((await firstResponse).value, 2);
	});
        
});
///tried to test webview but I see this error only some times and test is failing only some times Error: Could not register service workers: InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state..
///I see issue is due to DOM exception should continue to check more why is causes that failure some times.
function createHtmlDocumentWithBody(body: string): string {
	return /*html*/`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>Document</title>
    <h2>Activate EdgeWorker Version</h2>
</head>
<body>
	${body}
</body>
</html>`;
}
    function getMesssage<R = any>(webview: vscode.WebviewPanel): Promise<R> {
        return new Promise<R>(resolve => {
            const sub = webview.webview.onDidReceiveMessage(message => {
                sub.dispose();
                resolve(message);
            });
        });
    };
    
    export function disposeAll(disposables: vscode.Disposable[]) {
        while (disposables.length) {
            let item = disposables.pop();
            if (item) {
                item.dispose();
            }
        }
    }
    export function closeAllEditors(): Thenable<any> {
        return vscode.commands.executeCommand('workbench.action.closeAllEditors');
    }

    
