/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, it } from "mocha";
import * as assert from 'assert';
import * as vscode from 'vscode';
const path = require("path");

suite('testing edgeworker vscode extension', () => {
    it('check if workspace is assigned correctly', function(){
        this.timeout(10000);
		const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        console.log(folder);
		assert.ok(!!folder);
		if (folder) {
			let dirpath= path.resolve(__dirname,'../../../src/test/testSpace');
			console.log("the path is "+ dirpath);
            const path1= '/Users/hkambham/edgeworker-code-final-vscode/edgeworker-vscode/edgeworkers-vscode/src/test/testSpace';
            console.log(path1);
			assert.strictEqual(folder, dirpath);
		}
	});
});


