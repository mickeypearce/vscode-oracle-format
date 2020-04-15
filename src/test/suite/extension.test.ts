import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

const base = vscode.workspace.workspaceFolders![0].uri;

/**
 * loads and format a file.
 * @param file path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export function format(file: string) {
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

function getFileContent(file: string) {
  const absPath = path.join(base.fsPath, file);
  return fs.readFileSync(absPath);
}

/**
 * Compare file output (default settings)
 * with the output from extension.
 * @param fileInput path relative to workspace root
 * @param fileOutput path relative to workspace root
 */
async function formatDefault(fileInput: string, fileOutput: string) {
  const input = await format(fileInput);
  const output = getFileContent(fileOutput);
  assert.equal(input.result, output.toString());
}

suite('Test format Document', function () {
  test('it formats default', async () => formatDefault('defaultInput.sql', 'defaultOutput.sql'));
});