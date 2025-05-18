const checkAndTrade = require("./checkAndTrade");
const checkExitAndTrade = require("./checkExitAndTrade");
const exitPosition = require("./exitPosition");
const openNewPosition = require("./openNewPosition");


module.exports = {
    ...checkAndTrade,
    ...checkExitAndTrade,
    ...exitPosition,
    ...openNewPosition
}