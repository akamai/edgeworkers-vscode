/* eslint-disable @typescript-eslint/naming-convention */
export enum textForCmd{
    akamai_version = "akamai --version",
    akamai_edgeWorker_version = "akamai edgewo --version",
    akamai_sandbox_version = "akamai sandbox --version",
    install_akamai_edgeworkers = "akamai install edgeworkers",
    install_akamai_sandbox = "akamai install sandbox",
    akamai_help = "akamai --help",
    
}
export enum systemType{
    macOS = "Darwin",
    linux = "Linux",
    windows = "Windows_NT",

}

export enum ErrorMessageExt {
    downloadFlameExtFail = 'Failed to download extension Flame Chart Visualizer for JavaScript Profiles due to error -',
    akamai_cli_not_installed= "Akamai CLI is not installed. Do you want to install Akamai CLI ?",
    bundle_JSON_not_found= " Mandatory file missing - ",
    create_bundle_fail = " Failed to create EdgeWorker bundle - ",
    validate_bundle_fail = "  Failed to validate EdgeWorker bundle - ",
    bundle_already_exists = "  File already exists. Do you want to replace - ",
    display_original_error = " ---due to --- ",
    file_replace_error= "Cannot Replace the file - ",
    edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers',
    akamai_download_URI = 'https://developer.akamai.com/cli/docs/getting-started',
    akamai_sanbox_download= 'https://learn.akamai.com/en-us/webhelp/sandbox/sandbox-user-guide/GUID-0D12845D-255E-4054-8A1D-59D11B931B81.html',
    edgeWorkers_cli_to_install = "Akamai edgeworkers CLI is not installed. Click INSTALL to proceed",
    akamai_edgeworkers_cli_install_error = "Failed to install Akamai Edgeworkers. To manually install refer the below link: ",
    file_not_found = " File not found ",
    edgworkerid_fail= "Failed to fetch the EdgeWorker ids ",
    edgworkerDetails_fail= "Failed to fetch the EdgeWorker details ",
    bundle_download_fail= "Failed to download the EdgeWorker Bundle",
    bundle_files_fail = "Failed to fetch files",
    empty_edgeWorkerID = "Unable to upload tar ball without the EdgeWorker ID",
    edgeWorkerId_notFound= "Error: The edgeWorker ID is not linked to your account. Please try with another EdgeWorker ID",
    id_not_found= " :Id not Found",
    version_missing_bundleJSON = 'The version is not provided in Bundle.json file',
    Fail_to_upload_EW_sandbox= '  Filed to upload ',
    akamai_sandbox_not_installed = '  Akamai sandbox is not installed.',
    upload_EW_fail_by_no_sandbox = "To upload EdgeWorker to sandbox finish the installation of akamai sandbox",
    upload_ew_tosandbox_fail = "  Upload EdgeWorker to sandbox failed due to : ",
    if_sandbox_not_started = "For your Account we could not find any sandbox to upload the EdgeWorker. Please make sure your sandbox is started.",
    windowsTarCmdUnfound = "Your system does not have 7z software to perform to create bundle(.tgz) file. \n Solution:\n 1.Install 7z in your machine. use this link : https://www.7-zip.org/download.html \n 2. Set path in Environment Variables-> SystemVariables\n 3. Select path variable and click on edit \n 4. Click on new-->copy paste filepath to 7-zip from program files \n 5. Click on 'ok'",
}

export enum textForInfoMsg{
    downloadFlameExtManually = "You can manually download the extension 'Flame Chart Visualizer for JavaScript Profiles' at URL: https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-js-profile-flame (or) Goto  Extensions(shift+cmd+X) in vscode terminal --> search for 'Flame Chart Visualizer for JavaScript Profiles' --> click on install",
    cpuprofileFileDownloadSuccess = 'Successfully downloaded the extension Flame Chart Visualizer for JavaScript Profiles.',
    cpuProfileOptionMsg = `To view '.cpuprofile' files you should have extension 'Flame Chart Visualizer for JavaScript Profiles.' Click on 'Download' to automatically download the extension.`,
    file_found = " Mandatory file found ",
    bundle_name = "Enter EdgeWorker bundle name",
    create_bundle_success = "Successfully created the EdgeWorker bundle - ",
    validate_bundle_success = "Successfully validated the EdgeWorker bundle - ",
    tar_file_path = "Enter the file system path to download EdgeWorker bundle",
    tar_download_success = " Successfully downloaded EdgeWorker bundle for ",
    get_edgeWorker_id_User = "Enter EdgeWorker ID for which you want to Upload the Tar ball",
    upload_edgeWorker_success= "Successfully uploaded ",
    success_upload_ew_to_sandbox = 'is successfully uploaded to sandbox',
    info_to_test_edgeWorker_curl = "Use curl or a browser to test the functionality \n \nCurl: Run this command curl --header 'Host: www.example.com' http://127.0.0.1:9550/ \n \nBrowser: Open your /etc/hosts file and point the hostname associated with the property configuration to 127.0.0.1, then enter http://<your-hostname>:9550 in your browser.",
}