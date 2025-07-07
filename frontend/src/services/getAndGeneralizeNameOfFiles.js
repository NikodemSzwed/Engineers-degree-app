export default function getSourceFileName(url) {
    return new URL(url).pathname
        .split('/')
        .pop()
        .replace(/(-[0-9a-f]{8,})?\.[^.]+$/i, '');
}
