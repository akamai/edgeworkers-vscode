import {ErrorMessage} from '../utils/http-error-message';

export function handleError(err: any, commandId: any) {
    try {
        err = JSON.parse(err);
    } catch (e) {
        return {
            isError: true,
            error_reason: ""
        }
    }

    let status = err.status;
    if (status) {
        switch (status) {
            case 404: {
                commandId = commandId + "_ERROR";
                return {
                    isError: true,
                    error_reason:err["detail"]
                }
            }
            case 403: {
                return {
                    isError: true,
                    error_reason: ErrorMessage.GENERIC_403
                }
            }
            case 401: {
                let detail = err["title"] == undefined ? "" : err["title"];
                return {
                    isError: true,
                    error_reason: detail
                }
            }    
            case 400: {
                let errorMessage = ErrorMessage.UPDATE_EW_400;
                if (errorMessage === undefined) {
                  errorMessage = err.detail;
                }

                return {
                    isError: true,
                    error_reason: errorMessage
                }
            }
            case 504: {
                return {
                    isError: true,
                    error_reason:ErrorMessage.EW_TIMEOUT_ERROR
                }
            }    
            default: {
                let detail = err["detail"] == undefined ? "" : err["detail"];
                return {
                    isError: true,
                    error_reason: detail
                }
            }    

        }
    }
}