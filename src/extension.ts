"use strict";

import * as vscode from "vscode";
import { exec } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, resolve } from "path";
import * as util from 'util';

const execPromise = util.promisify(exec);

function parseOutputForErrors(input: string) {
  // Catch "parse error"
  if (input.search(/parse error/i) !== -1) {
    throw Error("Skipped formatting: parse error");
  }
  // Catch error loading rules
  if (input.search(/cannot be opened/i) !== -1) {
    throw Error("Formating rules cannot be loaded");
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
      const sqlPathConfig: string = vscode.workspace
        .getConfiguration("oracle-format")
        .get("sqlcl");

      const rulesPathConfig: string = vscode.workspace
        .getConfiguration("oracle-format")
        .get("rules");

      // Substutite ${workspaceFolder} variable in configuration paths
      const workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : null;
      // "sqlcl" is "sql" by default (relative path is hardly a use-case but anyway...)
      const sqlPath = sqlPathConfig.replace("${workspaceFolder}", workspaceFolder);
      // "rules" is null by default
      const rulesPath = rulesPathConfig
        ? resolve(rulesPathConfig.replace("${workspaceFolder}", workspaceFolder))
        : null;

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

      // Cmd command to execute script file with sqlcl
      const cmd = `"${sqlPath}" /nolog @"${formatScript}"`;
      output.appendLine(cmd);

      let execThen;
      let res;
      try {
        // Write formatting text to temp file and script to temp file
        if (!existsSync(storagePath)) {
          mkdirSync(storagePath);
        }
        writeFileSync(formatScript, cmdScript);
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

export function deactivate() { }
