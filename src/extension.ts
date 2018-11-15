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
  const output = vscode.window.createOutputChannel("oracle-format");

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

      // File content (document) is stored to a temp file for formatting
      const storagePath = context.storagePath || context.extensionPath;
      const tempFile = join(storagePath, `format_temp.sql`);

      // We store sqlcl format commands in a script file
      const cmdScript = rulesPath
        ? `set echo on
format rules ${rulesPath}
format file "${tempFile}" "${tempFile}"
exit`
        : `set echo on
format file "${tempFile}" "${tempFile}"
exit`;
      const formatScript = join(storagePath, "format.sql");
      writeFileSync(formatScript, cmdScript);

      // Cmd command to execute script file with sqlcl
      const cmd = `"${sqlPath}" /nolog @${formatScript}`;
      output.appendLine(cmd);

      let execThen;
      let res;
      try {
        // Save formatting text to temporary file
        if (!existsSync(storagePath)) {
          mkdirSync(storagePath);
        }
        writeFileSync(tempFile, document.getText(range));

        // Execute formating with SqlCl on temp file
        execThen = execPromise(cmd);
        vscode.window.setStatusBarMessage("Formatting...", execThen);
        res = await execThen;
        output.appendLine(res);

        // Lookup for errors
        parseOutputForErrors(res);

        // Read formatted content from file and replace content in editor
        const content = readFileSync(tempFile);
        return [vscode.TextEdit.replace(range, content.toString())];
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  });
}

export function deactivate() {}
