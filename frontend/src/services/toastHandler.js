export function toastHandler(severity, summary, detail, error = undefined) {
    let detailMsg = detail;
    if (error) {
        let reason;
        if (error.name === 'AxiosError') {
            reason = error.response?.data?.error || 'Brak odpowiedzi od serwera';
            if (error.response?.data?.details) {
                if (reason.endsWith('.') || reason.endsWith('!')) reason += ' ';
                else reason += '. ';
                reason += +error.response?.data?.details;
            }
        } else if (error.message) {
            reason = error.message;
        } else {
            reason = error;
        }
        detailMsg = detailMsg + ' Powód: ' + reason;
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
