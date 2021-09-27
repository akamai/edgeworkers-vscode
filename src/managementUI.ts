import * as vscode from 'vscode';
import * as path from 'path';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
import { ErrorMessageExt } from './textForCLIAndError';
const os = require('os');

export class EdgeWorkerDetailsProvider implements vscode.TreeDataProvider<EdgeWorkers> {
	private _onDidChangeTreeData: vscode.EventEmitter<EdgeWorkers | undefined|null> = new vscode.EventEmitter<EdgeWorkers | undefined|null>();
	readonly onDidChangeTreeData: vscode.Event<EdgeWorkers | undefined|null> = this._onDidChangeTreeData.event;
	public  edgeWorkerJsonArray = {};
	public listIds;
	public edgeWorkerdetails: string= '';
	constructor() {
		this.listIds = this.getListArrayOfEdgeWorker();
	}
	private async getListArrayOfEdgeWorker():Promise<string>{
		const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
		const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(await akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
		return(await fillVersions(listIds));
	}
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
	getTreeItem(element: EdgeWorkers): vscode.TreeItem {
		return element;
	}
	async getChildren(element?: EdgeWorkers): Promise<EdgeWorkers[]> {
		if (element) {
			console.log("the id id :"+ element.version +"and version is "+ element.label);
			if(element.type !== ''){
				return Promise.resolve(await this.getBundleFiles(element.version,element.label));
			}
			else{
				return Promise.resolve(await this.getEdgeWorkersDetails(element.version));
			}
		} else {
			return Promise.resolve(await this.getEdgeWorkers(await this.listIds));
		}
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
			if(edgeWorkerJson.length === 0){
				edgeworker = toDep(`No edge workers details`, '','none');
				edgeworkers.push(edgeworker);
			}
			else{
				edgeWorkerJson.forEach(async (element: any) => {
					let moduleName = element.name + " -- " + element.edgeWorkerId ;
					edgeworker = toDep(`${moduleName}`, `${element.edgeWorkerId}`, '');
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
		const edgeWorkerJsonDeatilsString: string= await this.listIds;
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
		if( edgeWorkerJsonDeatils.length !== 0){
			for(var i = 0; i < edgeWorkerJsonDeatils.length; i++) {
				edgeWorkerid = `${edgeWorkerJsonDeatils[i].edgeWorkerId}`;
				if( edgeWorkerid === element){
					if(edgeWorkerJsonDeatils[i].versions.length !== 0){
						for(var j = 0; j < edgeWorkerJsonDeatils[i].versions.length; j++){
							if(edgeWorkerJsonDeatils[i].versions[j].version === undefined || edgeWorkerJsonDeatils[i].versions[j].version === ""){
								edgeworkersDetail= toDep(`No Versions`, '','none','');
							}
							else{
								edgeworkersDetail = toDep(`${edgeWorkerJsonDeatils[i].versions[j].version}`,`${edgeworkerId}`, '','');
							}
							edgeworkersDetails.push(edgeworkersDetail);
						}
					}
					else{
						edgeworkersDetail = toDep(`No Versions`, '','none','');
						edgeworkersDetails.push(edgeworkersDetail);
					}
				}	
			}
		}
		return edgeworkersDetails;
	}
	public async getBundleFiles(edgeWorkerID:string,edgeWorkerVersion:string):Promise<EdgeWorkerFiles[]> {
		let bundleFiles: EdgeWorkerFiles[]= [];
		let bundleFile: EdgeWorkerFiles;
		const toDep = (moduleName: string): EdgeWorkerFiles => {
			return new EdgeWorkerFiles(moduleName,'',vscode.TreeItemCollapsibleState.None,'');
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
			let tarFilePath = os.tmpdir();
			let files = new Array();
			let fileNames = new Array();
			try{
				const cmd = await akamiCLICalls.getEdgeWorkerDownloadCmd("edgeworkers","download",edgeworkerID,edgeworkerVersion,tarFilePath,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
				const status = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"msg");
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
				akamiCLICalls.deleteOutput(`${tarFile}`);
				resolve(fileNames);
			}catch(e){
				reject(e);
			}
		});
	}
}

export const fillVersions = async function( ids:string):Promise<string>{
	return new Promise(async (resolve, reject) => {
		let edgeWorkerJsonString: string = ids;
		const edgeWorkerJson = JSON.parse(edgeWorkerJsonString);
		try{
			if(edgeWorkerJson.length !== 0){
				for(var i = 0; i < edgeWorkerJson.length; i++) {
					const getVersionCmd = await akamiCLICalls.getEdgeWorkerListVersions("edgeworkers","list-versions",`${edgeWorkerJson[i].edgeWorkerId}`,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
					const data = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(getVersionCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
					edgeWorkerJson[i].versions= JSON.parse(data);
				}
			}
			resolve(JSON.stringify(edgeWorkerJson));
		}catch(e){
			reject(e);
		}
	});
};

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
export class  EdgeWorkerFiles extends vscode.TreeItem {
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
	contextValue = 'EdgeWorkerFiles';
}