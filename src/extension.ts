// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict'
import { Console } from 'console';
import * as vscode from 'vscode';
const { spawn } = require('child_process');
const cp = require('child_process');
const edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers';
const akamai_version_cmd = 'akamai --version';
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('edgeworkers-vscode.edgeworkerBundle', function () {
        // run akamai --version command in cmd to check if akami CLI is installed
        cp.exec(akamai_version_cmd, async (err: string, stdout: string, stderr: string) => {            
            if (err) {
                console.log(err);
                const resp = await vscode.window.showErrorMessage(
                    'Akamai CLI is not installed. Do you want to install Akamai CLI ?',
                    'Install'
                  );
                  if (resp === 'Install') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(edgeworker_download_URI))
                    // vscode.env.openExternal(vscode.Uri.parse(edgeworker_download_URI));
                  }
            }
            else if(stderr){
                console.log('Stderr: ' + stderr);
            }
            else{
                console.log('Stdout: ' + stdout);
                // check if the bundle.json is present in the workspace
                if(checkBundle()){
                    const msg = vscode.window.showErrorMessage(
                        'Create edge worker bundle failed! Bundle.json not found in workspace'
                    );
                }
                else{
                    const msg = vscode.window.showInformationMessage(
                        'Bundle.json file found'
                    );
                    //create edge worker bundle
                    createEdgeWorkerBundle();
                }
            }
        });

    });
}
function checkBundle(): boolean {
    vscode.workspace.findFiles(`**/bundle.json`).then(files => {
        if(files.length<1 || files == undefined)
        {
            return true;
        }
    });
    return false;
}
function createEdgeWorkerBundle(){
    let options : vscode.InputBoxOptions = {};
    options.prompt = "Enter edge worker bundle name";
    let terminal = vscode.window.createTerminal("Akamai CLI");
    vscode.window.showInputBox(options).then(value => {
        var work_space_folder:string | undefined;
        if(vscode.workspace.workspaceFolders !== undefined){
            work_space_folder = vscode.workspace.workspaceFolders[0].uri.path;
            //create tar 
            createTar(terminal, value, work_space_folder);
            //validate tar using akamai CLI
            validateTar(terminal, value, work_space_folder);
        }
        else {
            let message = "YOUR-EXTENSION: Working folder not found, open a folder an try again" ;
            vscode.window.showErrorMessage(message);
        }
    });
}
function validateTar(terminal:vscode.Terminal, value: string | undefined, work_space_folder: string){
    vscode.workspace.createFileSystemWatcher("**/*.tgz").onDidCreate(file => {
        console.log(`tar file ${value}.tgz is created now at ${file}`);
        terminal.sendText(`akamai edgeworkers validate ${work_space_folder}/${value}.tgz --accountkey ***REMOVED***`);
        terminal.show();
        });
}
function createTar(terminal:vscode.Terminal,value: string | undefined,work_space_folder: string){    
    let tar = `tar --disable-copyfile -czvf ${value}.tgz *`;
    terminal.sendText(`cd ${work_space_folder}`);
    terminal.sendText(tar);
    terminal.show();
}
    // // trigger when the file is changed in workspae.
    // let disWorkspace = vscode.commands.registerCommand('edgeworkers-vscode.wsEvents', () =>{
    //     if(vscode.workspace){
    //         vscode.workspace.onDidChangeTextDocument(editor => {
    //             console.log("we have a change in workspcae");
    //         },null,context.subscriptions);
    //     }
    // });

    // //code for auto complete
    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascript', {
    //     provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):Promise<vscode.CompletionItem[]> 
    //     { 
    //         return new Promise((resolve, reject) => { 
    //             var completionItems:vscode.CompletionItem[] = [];
    //             var completionItem:vscode.CompletionItem = new vscode.CompletionItem("id");
    //             completionItem.kind = vscode.CompletionItemKind.Value;
    //             completionItem.detail = "ttest for EDGEworker code";
    //             completionItem.documentation = "this is used for testing";
    //             completionItem.filterText = "test";
    //             completionItem.insertText = "test";
    //             completionItem.label = "test";
    //             completionItems.push(completionItem);
    //             return resolve(completionItems);
    //         // return [new vscode.CompletionItem('Hello')];
    //         });
    //     }
    //     }));

// this method is called when your extension is deactivated
export function deactivate() {}
