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

When using with "formatOnSave" I suggest increasing default timeout as formatting takes quite some time for larger files:
```javascript
"editor.formatOnSaveTimeout": 10000
```

## Prerequisites

- Oracle SQLcl
- [Language PL/SQL](https://marketplace.visualstudio.com/items?itemName=xyz.plsql-language)
