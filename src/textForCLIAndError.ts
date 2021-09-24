/* eslint-disable @typescript-eslint/naming-convention */
export enum textForCmd{
    akamai_version = "akamai --version",
    akamai_sandbox_version = "akamai --version",
    
}
export enum systemType{
    macOS = "Darwin",
    linux = "Linux",
    windows = "Windows_NT",

}

export enum ErrorMessageExt {
    akamai_cli_not_installed= "Error: akamai CLI is not installed. Do you want to install Akamai CLI ?",
    bundle_JSON_not_found= "Error: Mandatory file missing - ",
    create_bundle_fail = "Error: Failed to create EdgeWorker bundle - ",
    validate_bundle_fail = "Error: Failed to validate EdgeWorker bundle - ",
    bundle_already_exists = "Error: File already exists. Do you want to replace - ",
    display_original_error = " ---due to --- ",
    file_replace_error= " Create new tar with different file name. Unable to replace the file - ",
    edgeworker_download_URI = 'https://github.com/akamai/cli-edgeworkers',
    akamai_sanbox_download= 'https://learn.akamai.com/en-us/webhelp/sandbox/sandbox-user-guide/GUID-0D12845D-255E-4054-8A1D-59D11B931B81.html',
    file_not_found = " File not found ",
    edgworkerid_fail= "Failed to fetch the Edgeworker ids ",
    edgworkerDetails_fail= "Failed to fetch the Edgeworker details ",
    bundle_download_fail= "Failed to download the Edgeworker Bundle",
    bundle_files_fail = "Failed to fetch files",
    empty_edgeWorkerID = "Unable to upload tar ball without the EdgeWorker ID",
    edgeWorkerId_notFound= "Error: The edgeWorker ID is not linked to your account.Please try with another EdgeWorker ID",
    id_not_found= " :Id not Found",
    version_missing_bundleJSON = 'Error: The version is not provided in Bundle.json file',
    Fail_to_upload_EW_sandbox= 'Error: Filed to upload ',
    akamai_sandbox_not_installed = 'Error: Akamai sandbox is not installed.',
    upload_EW_fail_by_no_sandbox = "To upload EdgeWorker to sandbox finish the installation of akamai sandbox",
    if_sandbox_not_started = "For your Account we could not find any sandbox to upload the Edgeworker. Please make sure your sandbox is started.",
    windowsTarCmdUnfound = "Your system does not have 7z software to perform to create bundle(.tgz) file. \n Solution:\n 1.Install 7z in your machine. use this link : https://www.7-zip.org/download.html \n 2. Set path in Environment Variables-> SystemVariables\n 3. Select path variable and click on edit \n 4. Click on new-->copy paste filepath to 7-zip from program files \n 5. Click on 'ok'",
}

export enum textForInfoMsg{
    file_found = " Mandatory file found ",
    bundle_name = "Enter EdgeWorker bundle name",
    create_bundle_success = "Successfully created the EdgeWorker bundle - ",
    validate_bundle_success = "Successfully validated the EdgeWorker bundle - ",
    tar_file_path = "Enter the file system path to download edgeworker bundle",
    tar_download_success = " Successfully downloaded edgeworker bundle for ",
    get_edgeWorker_id_User = "Enter Edge Worker ID for which you want to Upload the Tar ball",
    upload_edgeWorker_success= "Successfully uploaded ",
    success_upload_ew_to_sandbox = 'is successfully uploaded to sandbox',
    info_to_test_edgeWorker_curl = "Use curl or a browser to test the functionality \n \nCurl: Run this command curl --header 'Host: www.example.com' http://127.0.0.1:9550/ \n \nBrowser: Open your /etc/hosts file and point the hostname associated with the property configuration to 127.0.0.1, then enter http://<your-hostname>:9550 in your browser.",
}