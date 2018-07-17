"use strict";

import * as vscode from "vscode";
import { exec } from "child_process";

function execPromise(cmd: string): Thenable<any> {
  return new Promise(function(resolve, reject) {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("plsql", {
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): Promise<vscode.TextEdit[] | undefined> {
      const sqlPath = vscode.workspace
        .getConfiguration("oracle-format")
        .get("sqlcl");

      const rulesPath = vscode.workspace
        .getConfiguration("oracle-format")
        .get("rules");

      const file = document.fileName;

      const cmd = rulesPath
        ? `(echo format rules ${rulesPath} & echo format file ${file} ${file}) | "${sqlPath}" /nolog`
        : `(echo format file ${file} ${file}) | "${sqlPath}" /nolog`;

      let execThen;
      let res;
      try {
        execThen = execPromise(cmd);
        vscode.window.setStatusBarMessage("Formatting...", execThen);
        res = await execThen;
        console.log(res);
        return;
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  });
}

export function deactivate() {}
