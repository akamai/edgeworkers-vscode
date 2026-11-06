/* eslint-disable @typescript-eslint/naming-convention */
import {it} from "mocha";
import * as assert from 'assert';
import * as vscode from 'vscode';

const path = require("path");

suite('testing edgeworker vscode extension', () => {
    it('check if workspace is assigned correctly', function () {
        this.timeout(10000);
        const folder = vscode.workspace.workspaceFolders![0].uri.fsPath;
        console.log(folder);
        assert.ok(!!folder);
        if (folder) {
            let dirpath = path.resolve(__dirname, '../../../src/test/testSpace');
            console.log("the path is " + dirpath);
            assert.strictEqual(folder, dirpath);
        }
    });
});


