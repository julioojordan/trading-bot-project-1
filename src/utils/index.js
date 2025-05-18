const detectManualOrAutoExit = require("./detectManualOrAutoExit");
const logTradeToExcel = require("./logTradeToExcel");
const logTradeToExcel2 = require("./logTradeToExcel2");
const updateTradeStats = require("./updateTradeStats");
const utils = require("./utils");
const logger = require("./logger");

module.exports = {
    ...detectManualOrAutoExit,
    ...logTradeToExcel,
    ...logTradeToExcel2,
    ...updateTradeStats,
    ...utils,
    ...logger
}