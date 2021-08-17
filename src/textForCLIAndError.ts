/* eslint-disable @typescript-eslint/naming-convention */
export enum textForCmd{
    akamai_version = "akamai --version",
    
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
    file_not_found = " File not found ",
}
export enum textForInfoMsg{
    file_found = " Mandatory file found ",
    bundle_name = "Enter edge worker bundle name",
    create_bundle_success = "Successfully created the EdgeWorker bundle - ",
    validate_bundle_success = "Successfully validated the EdgeWorker bundle - ",
}