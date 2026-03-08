import fs from 'fs';
import path from 'path';
// Define log file location
const logFilePath = path.join(import.meta.dirname, '..', 'data.log');
export const appendToLog = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    // Asynchronously append to the file
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
};
export const getLogContent = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return resolve(''); // file doesn't exist yet, return empty
                }
                return reject(err);
            }
            resolve(data);
        });
    });
};
//# sourceMappingURL=logger.js.map