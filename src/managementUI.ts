import * as vscode from 'vscode';
import * as edgeWorkerCommands from './edgeWorkerCommands';
import * as akamaiCLICalls from './akamaiCLICalls';
import { ErrorMessageExt } from './textForCLIAndError';
import config from './config.json';
import { rejects } from 'assert';
import * as os from 'os';
import * as path from 'path';

export class EdgeWorkerDetailsProvider implements vscode.TreeDataProvider<EdgeWorkers | string | Promise<string>> {
    private _onDidChangeTreeData: vscode.EventEmitter<EdgeWorkers | string | Promise<string> | undefined|null> = new vscode.EventEmitter<EdgeWorkers |string| undefined|null>();
    readonly onDidChangeTreeData: vscode.Event<EdgeWorkers | string | Promise<string> | undefined|null> = this._onDidChangeTreeData.event;
    public  edgeWorkerJsonArray = {};
    public listIds: Promise<string>;
    public edgeWorkerdetails: string= '';
    constructor(listIDs:Promise<string>) {
        this.listIds = listIDs;
    }
    refresh(): void {
        this._onDidChangeTreeData.fire(this.listIds);
    }
    getTreeItem(element: EdgeWorkers): vscode.TreeItem {
        return element;
    }
    async getChildren(element?: EdgeWorkers): Promise<any[]> {
        if (element) {
            console.log("the id id : "+ element.ewId +" and version is "+ element.label);
            if (element.type === 'EWID') {
                return this.getEdgeWorkersDetails(element);
            } 
            else if (element.type === 'version'){
                return this.getBundleFiles(element.ewId,element.label);
            }
            else{
                return this.getEdgeWorkersDetails(element);
            }
        } else {
            return this.getEdgeWorkers();
        }
    }
    public async getEdgeWorkers(): Promise<EdgeWorkers[]> {
        let edgeWorkerJsonString: string = await this.listIds;
        let edgeworkers: EdgeWorkers[]= [];
        let edgeworker: EdgeWorkers;
        
        const toDep = (moduleName: string, version: string, collapsibleState: string): EdgeWorkers => {
            if(collapsibleState !== ''){
                return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.None,'EWID');
            }
            else{
                return new EdgeWorkers(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed,'EWID');
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
    public async getEdgeWorkersDetails(edgeWorker : EdgeWorkers): Promise<EdgeWorkerDetails[]> {
        const toDep = (moduleName: string, version: string,collapsibleState:string,type:string,): EdgeWorkerDetails => {
            if(collapsibleState !== ''){
                return new EdgeWorkerDetails(moduleName,version,vscode.TreeItemCollapsibleState.None,type);
            }
            else{
                return new EdgeWorkerDetails(moduleName,version,vscode.TreeItemCollapsibleState.Collapsed,type='version');
            }
        };
        
        let edgeWorkerId = edgeWorker.ewId;

        let edgeworkersDetails: EdgeWorkerDetails[]= [];
        let edgeworkersDetail: EdgeWorkerDetails; 

        const versions : any[] = await getVersions(edgeWorker);

        if(versions.length !== 0){
            for(var j = 0; j < versions.length; j++){
                if(versions[j].version === undefined || versions[j].version === ""){
                    edgeworkersDetail= toDep(`No Versions`, '','none','EWDetail');
                }
                else{
                    edgeworkersDetail = toDep(`${versions[j].version}`,`${edgeWorkerId}`, '','EWDetail');
                }
                edgeworkersDetails.push(edgeworkersDetail);
            }
        }
        else{
            edgeworkersDetail = toDep(`No Versions`, '','none','');
            edgeworkersDetails.push(edgeworkersDetail);
        }

        return edgeworkersDetails;
    }
    public async getBundleFiles(edgeWorkerId:string,edgeWorkerVersion:string):Promise<EdgeWorkerFiles[]> {
        let bundleFiles: EdgeWorkerFiles[]= [];
        let bundleFile: EdgeWorkerFiles;
        const toDep = (moduleName: string): EdgeWorkerFiles => {
            return new EdgeWorkerFiles(moduleName,'',vscode.TreeItemCollapsibleState.None,'EWFile');
        };
        try{
            const filenames = await this.downloadBundle(edgeWorkerId,edgeWorkerVersion);
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
            bundleFile = toDep(`error fetching bundle contents`);
            bundleFiles.push(bundleFile);
            vscode.window.showErrorMessage(ErrorMessageExt.bundle_files_fail+ErrorMessageExt.display_original_error+e.toString());
            return bundleFiles; 
        }    
    }
    public async downloadBundle(edgeWorkerId: string, edgeworkerVersion:string):Promise<string[]>{
        return new Promise(async (resolve, reject) => {
            let tarFilePath = os.tmpdir();
            let files = new Array();
            let fileNames = new Array();
            try{
                const tempFile = `akamaiCLIOutputBundle-${Date.now()}.json`;
                const cmd = await akamaiCLICalls.getEdgeWorkerDownloadCmd("edgeworkers","download",edgeWorkerId,edgeworkerVersion,tarFilePath,path.resolve(os.tmpdir(),tempFile));
                const status = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(cmd),path.resolve(os.tmpdir(),tempFile),"msg");
                console.log(status);
                const tarFile = await status.substring(status.indexOf('@') + 1);
                const tarFileName = path.parse(tarFile).base;
                const cmdViewTar:string[]= ["cd", `${tarFilePath}`,"&&","tar","-tvf",`${tarFileName}`];
                const status1 = await akamaiCLICalls.executeCLICommandExceptTarCmd(akamaiCLICalls.generateCLICommand(cmdViewTar));
                console.log(status1);
                files = status1.split("\n");
                files.forEach(function(element){
                    if(element !== ''){
                        const edgeworkerBundleName =  element.substr(element.lastIndexOf(' ')+1);
                        console.log(edgeworkerBundleName);
                        fileNames.push(edgeworkerBundleName);
                    }
                });
                akamaiCLICalls.deleteOutput(`${tarFile}`);
                resolve(fileNames);
            }catch(e){
                reject(e);
            }
        });
    }
}

export const getVersions = async function(edgeWorker:EdgeWorkers):Promise<any[]> {
    return getVersionsById(edgeWorker.ewId);
}

export const getVersionsById = async function(ewId:string):Promise<any[]> {
    try {
        const tempFile = `akamaiCLIOutput-${Date.now()}.json`;
        const getVersionCmd = await akamaiCLICalls.getEdgeWorkerListVersions("edgeworkers","list-versions",`${ewId}`,path.resolve(os.tmpdir(),tempFile));
        const data : string = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(getVersionCmd),path.resolve(os.tmpdir(),tempFile),"data");

        if (data.length===0|| data.length=== undefined||data ===""){
            return [];
        }
        else{
            return JSON.parse(data);
        }
    } catch(e:any) {
        vscode.window.showErrorMessage(`Cannot fetch versions for id :${ewId} due to `+e.toString());
        return [];
    }
}

export const getListIds = function():Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        try{
            const tempFile = `akamaiCLIOutput-${Date.now()}.json`;
            const listIdsCmd = await akamaiCLICalls.getEdgeWorkerListIds("edgeworkers","list-ids",path.resolve(os.tmpdir(),tempFile));
            const listIds = await akamaiCLICalls.executeAkamaiEdgeWorkerCLICmds(akamaiCLICalls.generateCLICommand(listIdsCmd),path.resolve(os.tmpdir(),tempFile),"data");
            resolve(listIds);
        }catch(e:any){
            reject(`Cannot fetch EdgeWorker Details due to ` +e.toString());
        }
    });
};

// this function is very slow and should only be used for the activation UI
export const getListIdsAndVersions = async function():Promise<string> {
    let listIdsAndVersions = [];
    try{
        let batchSize:number = Number(config.settings.EW_DETAILS_BATCH_SIZE)||5;
        let listIds = JSON.parse(await getListIds());
        let arr = Object.keys(listIds).map(function(k) { return listIds[k];});
        let results: any[] = [];
        for(let i=0;i<arr.length;i+=1){
            results.push(new Promise((resolve, reject) => {
                try {
                    let thisEwId = arr[i].edgeWorkerId;
                    getVersionsById(thisEwId).then((response) => {
                        let versions = response.map((el:any) => {return el.version});
            
                        resolve({edgeWorkerId: thisEwId, versions: versions});
                    });
                } catch (e) {
                    reject(e);
                }
            }));
        }

        listIdsAndVersions = await Promise.all(results);

        return JSON.stringify(listIdsAndVersions);
    }catch(e:any){
        throw new Error("Failed to fetch the Edgeworker details due to " + e.toString());
    }
};

export class EdgeWorkers extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly ewId: string,
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
        public readonly version: string,
        public readonly ewId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type:string,
        public readonly command?: vscode.Command,
    ) {
        super(version, collapsibleState);
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