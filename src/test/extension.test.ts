import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
// import { Uri } from 'vscode';

/**
 * loads and format a file.
 * @param file path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export function format(
    file: string,
    base: vscode.Uri = vscode.workspace.workspaceFolders![0].uri
) {
    const absPath = path.join(base.fsPath, file);
    return vscode.workspace.openTextDocument(absPath).then(doc => {
        const text = doc.getText();
        return vscode.window.showTextDocument(doc).then(
            () => {
                console.time(file);
                return vscode.commands
                    .executeCommand('editor.action.formatDocument')
                    .then(() => {
                        console.timeEnd(file);
                        return { result: doc.getText(), source: text };
                    });
            },
            e => console.error(e)
        );
    });
}
/**
 * Compare file output (default settings)
 * with the output from extension.
 * @param fileInput path relative to workspace root
 * @param fileOutput path relative to workspace root
 */
function formatDefault(fileInput: string, fileOutput: string) {
    return format(fileInput).then(result => {
        const fileFormatted = fs.readFileSync(fileOutput);
        assert.equal(result.result, fileFormatted);
    });
}

suite('Test format Document', function() {
    test('it formats default', () => formatDefault('defaultInput.sql', 'defaultOutput.sql'));
});