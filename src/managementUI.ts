import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from './config';
const config: Config = require('../config.json');
const exec = require('child_process').exec;
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
import * as edgeWorkersSvc from './openAPI/edgeActions/ew-service';
import { ErrorMessageExt } from './textForCLIAndError';
import { resolveCname } from 'dns';
import { errorMonitor } from 'stream';

export class EdgeWorkerDetailsProvider implements vscode.TreeDataProvider<EdgeWorkers> {
	private _onDidChangeTreeData: vscode.EventEmitter<EdgeWorkers | undefined | void> = new vscode.EventEmitter<EdgeWorkers | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<EdgeWorkers | undefined | void> = this._onDidChangeTreeData.event;
	public  edgeWorkerJsonArray = {};
	public accountKey:string= '';
	public listIds:string ='';
	public edgeWorkerdetails: string= '';
	constructor() {
		this.accountKey = edgeWorkerCommands.getAccountKeyFromUserConfig();
	}
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
	getTreeItem(element: EdgeWorkers): vscode.TreeItem {
		return element;
	}
	async getChildren(element?: EdgeWorkers): Promise<EdgeWorkers[]> {
		if (element) {
			return Promise.resolve(this.getEdgeWorkersDetails(element.version));
		} else {
			await akamiCLICalls.callAkamaiCLIFOrEdgeWorkerIDs(this.accountKey).then(async ids =>{
				this.listIds=ids;
				await this.fillDetails().then(details=>{
					this.edgeWorkerdetails= details;
				}).catch(err=>{
					vscode.window.showErrorMessage(ErrorMessageExt.edgworkerDetails_fail+ErrorMessageExt.display_original_error+err);
				});
			}).catch(err =>{
				this.listIds= '';
				vscode.window.showErrorMessage(ErrorMessageExt.edgworkerid_fail+ErrorMessageExt.display_original_error+err);
			});
			return Promise.resolve(this.getEdgeWorkers(this.listIds));
		}
	}
	private async fillDetails( ):Promise<string>{
		return new Promise(async (resolve, reject) => {
			let edgeWorkerJsonString: string = this.listIds;
			const edgeWorkerJson = JSON.parse(edgeWorkerJsonString);
			try{
				if(edgeWorkerJson.data !== undefined || edgeWorkerJson.data.length !== 0){
					for(var i = 0; i < edgeWorkerJson.data.length; i++) {	
						let versions  = await edgeWorkersSvc.getAllVersions(`${edgeWorkerJson.data[i].edgeWorkerId}`, `${this.accountKey}`);
						if(versions.hasOwnProperty("versions")){
							versions= versions["versions"];
							console.log(`the version details are ${versions}`);
						}
						edgeWorkerJson.data[i].versions= versions;
						edgeWorkerJson.data[i].versions.forEach((element: any) => {
							console.log(element);
						});
					}
					resolve(JSON.stringify(edgeWorkerJson));
				}
			}catch(e){
				reject(e);
			}
		});
	}
	public async getEdgeWorkers(edgeWorkerJsonString: string): Promise<EdgeWorkers[]> {
		let edgeworkers: EdgeWorkers[]= [];
		let edgeworker: EdgeWorkers;
		const toDep = (moduleName: string, version: string, collapsibleState: string): EdgeWorkers => {
			if(collapsibleState !== ''){
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.None);
			}
			else{
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed);
			}
		};

		if(edgeWorkerJsonString !== ''){
			const edgeWorkerJson = JSON.parse(edgeWorkerJsonString);
			if(Object.keys(edgeWorkerJson.data).length === 0){
				edgeworker = toDep(`No edge workers details`, '','none');
				edgeworkers.push(edgeworker);
			}
			else{
				edgeWorkerJson.data.forEach(async (element: any) => { 
					edgeworker = toDep(`${element.name}`, `${element.edgeWorkerId}`, '');
					edgeworkers.push(edgeworker);
				});
			}
			return edgeworkers; 
		}
		else{
			edgeworker = toDep(`cannot find edgeworkers`, '','none');
			edgeworkers.push(edgeworker);
			return edgeworkers; 
		}
	}
	public async getEdgeWorkersDetails(edgeworkerId : string): Promise<EdgeWorkers[]> {
		const edgeWorkerJsonDeatilsString: string= await this.edgeWorkerdetails;
		const edgeWorkerJsonDeatils = JSON.parse(edgeWorkerJsonDeatilsString);
		const toDep = (moduleName: string, version: string): EdgeWorkers => {
				return new EdgeWorkerDetails(moduleName,version,vscode.TreeItemCollapsibleState.None);
		};
		let element = `${edgeworkerId}`;
		let edgeworkersDetails: EdgeWorkerDetails[]= [];
		let edgeworkersDetail: EdgeWorkerDetails; 
		let edgeWorkerid:string;
		for(var i = 0; i < edgeWorkerJsonDeatils.data.length; i++) {
			edgeWorkerid = `${edgeWorkerJsonDeatils.data[i].edgeWorkerId}`;
			if( edgeWorkerid === element){
				if(edgeWorkerJsonDeatils.data[i].versions.length === 0){
					edgeworkersDetail = toDep(`No Versions`, '');
					edgeworkersDetails.push(edgeworkersDetail);
				}
				else{
					for(var j = 0; j < edgeWorkerJsonDeatils.data[i].versions.length; j++){
						edgeworkersDetail = toDep(`${edgeWorkerJsonDeatils.data[i].versions[j].version}`,`${edgeworkerId}`);
						edgeworkersDetails.push(edgeworkersDetail);
				}
			}
			}	
		}
		return edgeworkersDetails;
	}
}

export class  EdgeWorkers extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = '';
	}
	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'EdgeWorkers.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'EdgeWorkers.svg')
	};
	contextValue = 'EdgeWorkers';
}

export class EdgeWorkerDetails extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command,
	) {
		super(label, collapsibleState);
		this.tooltip = '';
	}
	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'EdgeWorkers.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'EdgeWorkers.svg')
	};
	contextValue = 'EdgeWorkerDetails';
}