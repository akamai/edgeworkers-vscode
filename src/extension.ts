// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):Promise<vscode.CompletionItem[]> 
		{ 
			return new Promise((resolve, reject) => { 
				var completionItems:vscode.CompletionItem[] = [];
				var completionItem:vscode.CompletionItem = new vscode.CompletionItem("id");
				completionItem.kind = vscode.CompletionItemKind.Value;
				completionItem.detail = "ttest for EDGEworker code";
				completionItem.documentation = "this is used for testing";
				completionItem.filterText = "test";
				completionItem.insertText = "test";
				completionItem.label = "test";
				completionItems.push(completionItem);
				return resolve(completionItems);
			// return [new vscode.CompletionItem('Hello')];
			});
		}
		

		}));
	}

// this method is called when your extension is deactivated
export function deactivate() {}
