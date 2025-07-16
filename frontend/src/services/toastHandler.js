export function toastHandler(severity, summary, detail, error = undefined) {
    let detailMsg = detail;
    if (error) {
        if (error.name === 'AxiosError') {
            detailMsg = detailMsg + ' Powód: ' + error.response.data.error;
        } else if (error.message) {
            detailMsg = detailMsg + ' Powód: ' + error.message;
        } else {
            detailMsg = detailMsg + ' Powód: ' + error;
        }
        console.error('Error additional information: ', error);
    }
    let life = 2000;
    if (severity === 'warn') {
        life = 6000;
    } else if (severity === 'error') {
        life = 6000;
    }

    return { severity: severity, summary: summary, detail: detailMsg, life: life };
}
