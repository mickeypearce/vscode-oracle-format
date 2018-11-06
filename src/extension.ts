"use strict";

import * as vscode from "vscode";
import { exec } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

function execPromise(cmd: string): Promise<any> {
  return new Promise(function(resolve, reject) {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });
}

function parseOutputForErrors(input: string) {
  // Catch "parse error"
  if (input.search(/parse error/i) !== -1) {
    throw Error("Skipped formatting: parse error");
  }
  // Catch any unknow "error"
  const reg = /^.*error.*$/gim;
  const s = reg.exec(input);
  if (s !== null) {
    throw Error(s[0]);
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentRangeFormattingEditProvider("plsql", {
    async provideDocumentRangeFormattingEdits(
      document: vscode.TextDocument,
      range: vscode.Range
    ): Promise<vscode.TextEdit[] | undefined> {
      const sqlPath = vscode.workspace
        .getConfiguration("oracle-format")
        .get("sqlcl");

      const rulesPath = vscode.workspace
        .getConfiguration("oracle-format")
        .get("rules");

      const storagePath = context.storagePath || context.extensionPath;
      const file = join(storagePath, `format_temp.sql`);

      const cmd = rulesPath
        ? `(echo format rules ${rulesPath} & echo format file ${file} ${file}) | "${sqlPath}" /nolog`
        : `(echo format file ${file} ${file}) | "${sqlPath}" /nolog`;

      let execThen;
      let res;
      try {
        // Save formatting text to temporary file
        if (!existsSync(storagePath)) {
          mkdirSync(storagePath);
        }
        writeFileSync(file, document.getText(range));

        // Execute formating with SqlCl on temp file
        execThen = execPromise(cmd);
        vscode.window.setStatusBarMessage("Formatting...", execThen);
        res = await execThen;
        console.log(res);

        // Lookup for errors
        parseOutputForErrors(res);

        // Read formatted content from file and replace content in editor
        const content = readFileSync(file);
        return [vscode.TextEdit.replace(range, content.toString())];
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  });
}

export function deactivate() {}
