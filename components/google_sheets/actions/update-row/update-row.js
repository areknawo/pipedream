const googleSheets = require("../../google_sheets.app");

module.exports = {
  key: "google_sheets-update-row",
  name: "Update Row",
  description: "Update a row in a spreadsheet",
  version: "0.0.1",
  type: "action",
  props: {
    googleSheets,
    drive: {
      propDefinition: [
        googleSheets,
        "watchedDrive",
      ],
      description: "The drive containing the worksheet to update",
    },
    sheetId: {
      propDefinition: [
        googleSheets,
        "sheetID",
        (c) => ({
          driveId: googleSheets.methods.getDriveId(c.drive),
        }),
      ],
      description: "The spreadsheet containing the worksheet to update",
    },
    sheetName: {
      propDefinition: [
        googleSheets,
        "sheetName",
        (c) => ({
          sheetId: c.sheetId,
        }),
      ],
    },
    row: {
      propDefinition: [
        googleSheets,
        "row",
      ],
    },
    cells: {
      propDefinition: [
        googleSheets,
        "cells",
      ],
    },
  },
  async run() {
    const cells = this.cells;

    // validate input
    if (!cells || !cells.length) {
      throw new Error("Please enter an array of elements in `Cells / Column Values`.");
    }
    if (!Array.isArray(cells)) {
      throw new Error("Cell / Column data is not an array. Please enter an array of elements in `Cells / Column Values`.");
    }
    if (Array.isArray(cells[0])) {
      throw new Error("Cell / Column data is a multi-dimensional array. A one-dimensional is expected.");
    }
    const request = {
      spreadsheetId: this.sheetId,
      range: `${this.sheetName}!${this.row}:${this.row}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [
          cells,
        ],
      },
    };
    return await this.googleSheets.updateSpreadsheet(request);
  },
};
