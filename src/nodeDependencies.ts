import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { runInThisContext } from 'vm';
import { resolve } from 'path';
import { defaultMaxListeners } from 'events';
import { Config } from './config';
const config: Config = require('../config.json');
import * as edgeWorkersSvc from './openAPI/edgeActions/ew-service';
const exec = require('child_process').exec;

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {


	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
	public  packageJsonArray = {};
	public listIdsPromise : Promise<string>;
	public jsonString: Promise<string>;
	constructor(private accountKey: string) {
		this.listIdsPromise = this.callAkamaiCli('list-ids');
		this.jsonString= this.fillDetails();	
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: Dependency): Promise<Dependency[]> {
		if (element) {
			return Promise.resolve(this.getDepsInPackageJsonDeatils(element.version));
		} else {
			// TODO: may need to handle failure of command to get json
			let packageJsonString : string = await this.listIdsPromise;
			return Promise.resolve(this.getDepsInPackageJson(packageJsonString));
		}

	}
	private async fillDetails():Promise<string>{
		let packageJsonString : string = await this.listIdsPromise;
		const packageJson = JSON.parse(packageJsonString);
		for(var i = 0; i < packageJson.data.length; i++) {	
			let versions  = await edgeWorkersSvc.getAllVersions(`${packageJson.data[i].edgeWorkerId}`, `${this.accountKey}`);
			if(versions.hasOwnProperty("versions")){
				versions= versions["versions"];
				console.log(`the version details are ${versions}`);
			}
			packageJson.data[i].versions= versions;
			packageJson.data[i].versions.forEach((element: any) => {
			console.log(element);
			});
		}
		this.packageJsonArray  = packageJson;
		return(JSON.stringify(packageJson));
	}
	private async getDepsInPackageJson(packageJsonString: string): Promise<Dependency[]> {
		const packageJson = JSON.parse(packageJsonString);
		const toDep = (moduleName: string, version: string, collapsibleState: string): Dependency => {
				if(collapsibleState !== ''){
					return new Dependency(moduleName,version,vscode.TreeItemCollapsibleState.None);
				}
				else{
					return new Dependency(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed);
				}
				
		};
		let edgeworkers: Dependency[]= [];
		let edgeworker: Dependency; 
		if(Object.keys(packageJson.data).length === 0){
			edgeworker = toDep(`No edge workers`, '','none');
			edgeworkers.push(edgeworker);
		}
		else{
			packageJson.data.forEach(async (element: any) => { 
				edgeworker = toDep(`${element.name}`, `${element.edgeWorkerId}`, '');
				edgeworkers.push(edgeworker);
			});
		}
		
		return edgeworkers;
	}
	private async getDepsInPackageJsonDeatils(edgeworkerId : string): Promise<Dependency[]> {
		const packageJsonDeatilsString: string= await this.jsonString;
		const packageJsonDeatils = JSON.parse(packageJsonDeatilsString);
		const toDep = (moduleName: string, version: string): Dependency => {
				return new Dependency(moduleName,version,vscode.TreeItemCollapsibleState.None);
		};
		let element = `${edgeworkerId}`;
		let edgeworkersDetails: Dependency[]= [];
		let edgeworkersDetail: Dependency; 
		let edgeWorkerid:string;
		for(var i = 0; i < packageJsonDeatils.data.length; i++) {
			edgeWorkerid = `${packageJsonDeatils.data[i].edgeWorkerId}`;
			if( edgeWorkerid === element){
				if(packageJsonDeatils.data[i].versions.length === 0){
					edgeworkersDetail = toDep(`No Versions`, '');
					edgeworkersDetails.push(edgeworkersDetail);
				}
				else{
					for(var j = 0; j < packageJsonDeatils.data[i].versions.length; j++){
						edgeworkersDetail = toDep(`${packageJsonDeatils.data[i].versions[j].version}`, `${packageJsonDeatils.data[i].versions[j].version.edgeWorkerId}`);
						edgeworkersDetails.push(edgeworkersDetail);
				}

			}
			}	
		}
		return edgeworkersDetails;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}
		return true;
	}

	private async callAkamaiCli(command : string) : Promise<string> {
		return new Promise((resolve, reject) => { 
			if(this.accountKey === '' || this.accountKey === undefined){
				reject(`Account key undefined. Please check the configuration settings.`);
			}
			else{
				exec(`akamai edgeworkers ${command} --accountkey  ${this.accountKey} --json /tmp/output.json > /dev/null 2>&1 && cat /tmp/output.json && rm /tmp/output.json`, {maxBuffer: config.settings.bufferSize, timeout: config.settings.timeOut}, (error : any, stdout : string, stderr : string) => {
					if (error) {
						reject(`In valid account key. Unable to fetch list of edge workers for the account key ${this.accountKey}`);
						// reject(`call to akamai cli process failed: ${error}`);
					} else if (stdout) {
						resolve(stdout);
					}
				});
			}
			
		});
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		// this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}
