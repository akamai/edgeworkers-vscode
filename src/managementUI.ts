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
			if(element.type !== ''){
				return Promise.resolve(this.getBundleFiles(element.version,element.label));
			}
			else{
				return Promise.resolve(this.getEdgeWorkersDetails(element.version));
			}
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
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.None,'');
			}
			else{
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed,'');
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
	public async getEdgeWorkersDetails(edgeworkerId : string): Promise<EdgeWorkerDetails[]> {
		const edgeWorkerJsonDeatilsString: string= await this.edgeWorkerdetails;
		const edgeWorkerJsonDeatils = JSON.parse(edgeWorkerJsonDeatilsString);
		const toDep = (moduleName: string, version: string,collapsibleState:string,type:string,): EdgeWorkerDetails => {
			if(collapsibleState !== ''){
				return new EdgeWorkerDetails(moduleName,version,vscode.TreeItemCollapsibleState.None,type);
			}
			else{
				return new EdgeWorkerDetails(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed,type='version');
			}
		};
		let element = `${edgeworkerId}`;
		let edgeworkersDetails: EdgeWorkerDetails[]= [];
		let edgeworkersDetail: EdgeWorkerDetails; 
		let edgeWorkerid:string;
		for(var i = 0; i < edgeWorkerJsonDeatils.data.length; i++) {
			edgeWorkerid = `${edgeWorkerJsonDeatils.data[i].edgeWorkerId}`;
			if( edgeWorkerid === element){
				if(edgeWorkerJsonDeatils.data[i].versions.length === 0){
					edgeworkersDetail = toDep(`No Versions`, '','none','');
					edgeworkersDetails.push(edgeworkersDetail);
				}
				else{
					for(var j = 0; j < edgeWorkerJsonDeatils.data[i].versions.length; j++){
						edgeworkersDetail = toDep(`${edgeWorkerJsonDeatils.data[i].versions[j].version}`,`${edgeworkerId}`, '','');
						edgeworkersDetails.push(edgeworkersDetail);
				}
			}
			}	
		}
		return edgeworkersDetails;
	}
	public async getBundleFiles(edgeWorkerID:string,edgeWorkerVersion:string):Promise<EdgeWorkers[]> {
		let bundleFiles: EdgeWorkers[]= [];
			let bundleFile: EdgeWorkers;
			const toDep = (moduleName: string): EdgeWorkers => {
				return new EdgeWorkers(moduleName,'',vscode.TreeItemCollapsibleState.None,'');
		};
		try{
			const filenames = await this.downloadBundle(edgeWorkerID,edgeWorkerVersion);
			if(filenames.length <1 || filenames === undefined){
				bundleFile = toDep(`no files found`);
				bundleFiles.push(bundleFile);
				return bundleFiles; 
			}
			else{
				filenames.forEach(function(name){
					bundleFile = toDep(name);
					bundleFiles.push(bundleFile);
					});
				return bundleFiles; 
			}
		}catch(e){
			bundleFile = toDep(`error in fetching files`);
			bundleFiles.push(bundleFile);
			vscode.window.showErrorMessage(ErrorMessageExt.bundle_files_fail+ErrorMessageExt.display_original_error+e);
			return bundleFiles; 
		}	
	}
	public async downloadBundle(edgeworkerID: string, edgeworkerVersion:string):Promise<string[]>{
		return new Promise(async (resolve, reject) => {
			let tarFilePath = '/tmp';
			let files = new Array();
			let fileNames = new Array();
			try{
				const cmd:string[]= ["akamai","edgeworkers","download",`${edgeworkerID}`, `${edgeworkerVersion}`,"--downloadPath", `${tarFilePath}`];
				if (this.accountKey !== ''|| typeof this.accountKey !== undefined){
					const accountKeyParams:string[]= ["--accountkey",`${this.accountKey}`];
					cmd.push(...accountKeyParams);
				}
				const status = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmd));
				console.log(status);
				const tarFile = await status.substring(status.indexOf('@') + 1);
				const tarFileName = path.parse(tarFile).base;
				const cmdViewTar:string[]= ["cd", `${tarFilePath}`,"&&","tar","-tvf",`${tarFileName}`];
				const status1 = await akamiCLICalls.executeCLICommandExceptTarCmd(akamiCLICalls.generateCLICommand(cmdViewTar));
				console.log(status1);
				files = status1.split("\n");
				files.forEach(function(element){
					if(element !== ''){
						const edgeworkerBundleName =  element.substr(element.lastIndexOf(' ')+1);
						console.log(edgeworkerBundleName);
						fileNames.push(edgeworkerBundleName);
					}
				});
				const delCmd:string=`rm ${tarFile}`;
				akamiCLICalls.deleteOutput(delCmd);
				resolve(fileNames);
			}catch(e){
				reject(e);
			}
		});
	}
}

export class  EdgeWorkers extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly type:string,
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
		public readonly type:string,
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