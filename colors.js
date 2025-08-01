// colors.js

// #332288",
// #88CCEE",
// #44AA99",
// #117733",
// #999933",
// #DDCC77",
// #CC6677",
// #882255",
// #AA4499"
const col = {
  red: "#332288", // Super-aged
  yellow: "#AA4499", // Aged
  blue: "#88CCEE", // Aging
  gray: "#aaaaaa", // No aging
  title: "midnightblue",
};
let colorScale3 = d3
  .scaleThreshold()
  .domain([7, 14, 20])
  .range([col.gray, col.blue, col.yellow, col.red]);

//
//.
const colorScale = d3
  .scaleLinear()
  .domain([0, 7, 14, 20, 35]) //
  .range([
    col.gray, //
    col.blue, //
    col.yellow, //
    col.red, //
  ])
  .interpolate(d3.interpolateRgb);
