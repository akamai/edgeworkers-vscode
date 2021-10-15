import * as vscode from 'vscode';
import * as path from 'path';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamiCLICalls from './akamiCLICalls';
import { ErrorMessageExt } from './textForCLIAndError';
import config from './config.json';
import { rejects } from 'assert';
const os = require('os');

export class EdgeWorkerDetailsProvider implements vscode.TreeDataProvider<EdgeWorkers> {
	private _onDidChangeTreeData: vscode.EventEmitter<EdgeWorkers | undefined|null> = new vscode.EventEmitter<EdgeWorkers | undefined|null>();
	readonly onDidChangeTreeData: vscode.Event<EdgeWorkers | undefined|null> = this._onDidChangeTreeData.event;
	public  edgeWorkerJsonArray = {};
	public listIds;
	public edgeWorkerdetails: string= '';
	constructor(listIDs:string) {
		this.listIds = listIDs;
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
		let stringDisplay: string = "";
		const toDep = (moduleName: string, version: string, collapsibleState: string): EdgeWorkers => {
			if(collapsibleState !== ''){
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.None,'');
			}
			else{
				return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed,'');
			}
		};
		if(edgeWorkerJsonString === '' || edgeWorkerJsonString === undefined || edgeWorkerJsonString.length === 0 ){
			edgeworkers.push(toDep("No EdgeWorker details", '','none'));
			return edgeworkers; 
		}
		else{
			const edgeWorkerJson = JSON.parse(edgeWorkerJsonString);
			edgeWorkerJson.forEach(async (element: any) => {
				if(element.name === undefined || element.edgeWorkerId === undefined ||element.name === "" || element.edgeWorkerId === "" ){
					edgeworkers.push(toDep("No EdgeWorker details", '','none'));
					return edgeworkers; 
				}
				else{
					let moduleName = element.name + " -- " + element.edgeWorkerId ;
					edgeworker = toDep(`${moduleName}`, `${element.edgeWorkerId}`, '');
					edgeworkers.push(edgeworker);
				}
			});
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
		}catch(e:any){
			bundleFile = toDep(`error in fetching files`);
			bundleFiles.push(bundleFile);
			vscode.window.showErrorMessage(ErrorMessageExt.bundle_files_fail+ErrorMessageExt.display_original_error+e.toString());
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
	return new Promise(async (resolve) => {
		let edgeWorkerJsonString: string = ids;
		const edgeWorkerJson = JSON.parse(edgeWorkerJsonString);
		if(edgeWorkerJson.length !== 0){
			for(var i = 0; i < edgeWorkerJson.length; i++) {
				const getVersionCmd = await akamiCLICalls.getEdgeWorkerListVersions("edgeworkers","list-versions",`${edgeWorkerJson[i].edgeWorkerId}`,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
				try{
					const data = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(getVersionCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
					edgeWorkerJson[i].versions= JSON.parse(data);
				}catch(e:any){
					vscode.window.showErrorMessage(`cannot fetch versions for id :${edgeWorkerJson[i].edgeWorkerId} due to `+e.toString());
					edgeWorkerJson[i].versions= "";
				}
			}
		}
		resolve(JSON.stringify(edgeWorkerJson));
	});
};

export const getListIdsAndVersions = async function():Promise<string> {
    let listIdsAndVersions = [];
    try{
        let batchSize:number = Number(config.settings.EW_DETAILS_BATCH_SIZE)||5;
        let listIds = JSON.parse(await getListIds());
        let arr = Object.keys(listIds).map(function(k) { return listIds[k];});
		for(let i=0;i<arr.length;i+=1){
			let results = await Promise.all(
                arr
				.slice(i,i+1)
                .map((obj: any) => getVersions(obj))
            );
            listIdsAndVersions.push(...results);
		}
        return Promise.resolve(JSON.stringify(listIdsAndVersions));
    }catch(e:any){
        vscode.window.showErrorMessage("Failed to fetch the Edgeworker details");
		return "";
    }
};
export const getVersions = async function( edgeWorker:any):Promise<any>{
    return new Promise(async (resolve) => {
            if(edgeWorker.length !== 0){
                    const getVersionCmd = await akamiCLICalls.getEdgeWorkerListVersions("edgeworkers","list-versions",`${edgeWorker.edgeWorkerId}`,path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
                    await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(getVersionCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data")
					.then((data => {
						if(data.length===0|| data.length=== undefined||data ===""){
							edgeWorker.versions = "";
						}
						else{
							edgeWorker.versions= JSON.parse(data);
						}
						
					}))
					.catch((e:any)=>{
						vscode.window.showErrorMessage(`cannot fetch versions for id :${edgeWorker.edgeWorkerId} due to `+e.toString());
						edgeWorker.versions = "";
					});
            }
            await new Promise((resolve)=> setTimeout(resolve,1000));
            resolve(edgeWorker);
    });
};


export const getListIds = async function():Promise<string>{
	try{
		const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
		const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
		return Promise.resolve(listIds);
	}catch(e:any){
		vscode.window.showErrorMessage(`cannot fetch edgeworker Details due to `+e.toString());
		return "";
	}
};

export const getListArrayOfEdgeWorker= async function():Promise<string>{
	try{
		const listIdsCmd= await akamiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),"akamaiCLIOput.json"));
		const listIds = await akamiCLICalls.executeAkamaiEdgeWorkerCLICmds(await akamiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),"akamaiCLIOput.json"),"data");
		return(await fillVersions(listIds));
	}catch(e:any){
		vscode.window.showErrorMessage(`cannot fetch edgeworker Details due to `+e.toString());
		return "";
	}
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