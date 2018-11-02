# oracle-format

> PL/SQL formatter using SQLcl

Inspired by [atom-oracle-format](https://github.com/diesire/atom-oracle-format) and [SQLcl – Setting Up the Formatter](https://www.thatjeffsmith.com/archive/2017/03/sqlcl-setting-up-the-formatter/).

## Usage

Works with `Format Document`, `Format Selection` commands and `editor.formatOnSave` setting for `plsql` language files.

## Configuration

```javascript
// (Optional) Executing sql from PATH otherwise...
"oracle-format.sqlcl": "/absolute/path/to/sql.exe",
// (Optional) Using default formatter settings otherwise...
"oracle-format.rules": "/absolute/path/to/style.xml"
```

## Prerequisites

- Oracle SQLcl
