//chart2_ex.js
let data_chart2;
let x, y, radiusScale;
const groupMap = {
  C: "super",
  B: "aged",
  A: "aging",
  N: "none",
};

function loadTableHTML(file, containerId) {
  fetch(file)
    .then((response) => response.text())
    .then((html) => {
      document.getElementById(containerId).innerHTML = html;
    });
}

function createFilteredData(year, indicator) {
  return tooltipData
    .filter((d) => d.year === year && d.gni > 0 && d.plus65 > 0)
    .map((d) => ({
      country: d.country,
      gni: d.gni,
      plus65: d.plus65,
      radiusValue: d[indicator],
      birth: d.birth,
      healthExp: d.healthExp,
      govHealthExp: d.govHealthExp,
      gdp: d.gdp,
      lifeExpectancy: d.lifeExpectancy,
      oldRatio: d.oldRatio,
      oopPct: d.oopPct,
      oopUSD: d.oopUSD,
      group: d.agedState,
    }));
}

function createViz2() {
  if (!tooltipData || tooltipData.length === 0) {
    console.error("tooltipData is not ready.");
    return;
  }

  const year = 2012;
  const selected = d3.select("#radiusIndicator").property("value");

  const data = createFilteredData(year, selected);

  scatter_65gni(data, year, selected);

  //
  d3.select("#radiusIndicator").on("change", () => {
    const newSelected = d3.select("#radiusIndicator").property("value");
    const updatedData = createFilteredData(year, newSelected);
    scatter_65gni(updatedData, year, newSelected);
  });

  //
  //
  d3.select("#show2022_v2").on("click", () => {
    const selected = d3.select("#radiusIndicator").property("value");
    const data2022 = createFilteredData(2022, selected);
    updateCircles(data2022, 2022, selected); //
  });
}

/////////////////////////////////////////

function updateCircles(data, year, selected) {
  d3.select("#svg2")
    .selectAll("circle.dot")
    .data(data, (d) => d.country)
    .transition()
    .duration(2000)
    .attr("cx", (d) => x(d.gni))
    .attr("cy", (d) => y(d.plus65))
    .attr("r", (d) =>
      selected === "default"
        ? 5
        : d.radiusValue > 0
        ? radiusScale(d.radiusValue)
        : 3
    )
    .attr("fill", (d) => colorScale(d.plus65));

  d3.select("#svg2")
    .selectAll("circle.dot")
    .on("mouseover", (event, d) => showTooltip(d, year, event, selected))
    .on("mouseout", hideTooltip);

  // Table update
  Object.entries(groupMap).forEach(([groupCode, htmlClass]) => {
    const filtered =
      selected === "default"
        ? data.filter((d) => d.group === groupCode)
        : data.filter((d) => d.group === groupCode && !isNaN(d[selected]));

    const value2022 =
      selected === "default"
        ? filtered.length
        : d3.mean(filtered, (d) => +d[selected]);

    const tdSelector = `.data_2022_${htmlClass}`;
    const changeSelector = `.change_${htmlClass}`;
    const prevText = d3.select(`.data_2012_${htmlClass}`).text();

    //
    let value2012;
    if (selected === "default") {
      const parsed = parseInt(prevText);
      value2012 = isNaN(parsed) ? null : parsed;
    } else {
      const parsed = parseFloat(prevText);
      value2012 = isNaN(parsed) ? null : parsed;
    }

    const diff =
      value2022 != null && value2012 != null
        ? (value2022 - value2012).toFixed(2)
        : "N/A";

    //
    d3.select(tdSelector)
      .style("opacity", 0)
      .text(
        value2022 != null
          ? selected === "default"
            ? value2022
            : value2022.toFixed(2)
          : "N/A"
      )
      .transition()
      .duration(2000)
      .style("opacity", 1);

    //
    d3.select(changeSelector)
      .transition()
      .duration(2000)
      .style("opacity", 1)
      .tween("text", function () {
        const i = d3.interpolateNumber(0, diff !== "N/A" ? diff : 0);
        return function (t) {
          this.textContent = diff !== "N/A" ? i(t).toFixed(2) : "N/A";
        };
      });
  });
}

//////////////////////////////////////////////////////
function scatter_65gni(data, year, selected) {
  const svg = d3.select("#svg2");
  svg.selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg
    .append("text")
    .attr("x", 10) //
    .attr("y", 20) //
    .attr("text-anchor", "start")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .text("Over-65 Population(%) vs GNI($)");
  // y축레이블
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`) //
    .attr("x", -height / 2 + 18) //
    .attr("y", 25) //
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .text("Over-65 Population(%)")
    .style("font-size", "18px");
  //x축레이블-Year
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2 + 20) //
    .attr("y", height + margin.bottom / 2 + 50) //
    .text(" GNI($)")
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .style("font-size", "18px");
  //
  //

  //
  x = d3.scaleLog().domain([500, 100000]).range([1, width]).nice();

  y = d3.scaleLinear().domain([0, 35]).range([440, 0]).nice();
  radiusScale = d3.scaleSqrt().domain([0, 1000]).range([3, 18]);

  // Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues([2000, 5000, 10000, 20000, 50000, 100000])
        .ticks(5, "~s")
    );
  g.append("g").call(d3.axisLeft(y));

  const tickVals = [
    10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
  ];

  const tickx = [2000, 5000, 10000, 20000, 50000, 100000];

  tickx.forEach((xVal) => {
    if (xVal > 0) {
      g.append("line")
        .attr("x1", x(xVal))
        .attr("y1", 0)
        .attr("x2", x(xVal))
        .attr("y2", height)
        .attr("stroke", "#bbb")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2"); //
    }
  });
  //#a6cee3","#b2df8a","#fdbf6f
  g.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", y(20))
    .attr("fill", col.red)
    .attr("opacity", 0.15);
  //  (14~20%)
  g.append("rect")
    .attr("x", 0)
    .attr("y", y(20))
    .attr("width", width)
    .attr("height", y(14) - y(20))
    .attr("fill", col.yellow)
    .attr("opacity", 0.1);
  g.append("rect")
    .attr("x", 0)
    .attr("y", y(14))
    .attr("width", width)
    .attr("height", y(7) - y(14))
    .attr("fill", col.blue)
    .attr("opacity", 0.1);

  // Circles
  const circles = g.selectAll("circle").data(data, (d) => d.country);

  circles
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.gni)) //
    .attr("cy", (d) => y(d.plus65)) //
    .attr("r", (d) => {
      if (selected === "default") return 5;
      const v = d[selected];
      return v > 0 ? radiusScale(v) : 3;
    })
    .attr("fill", (d) => colorScale(d.plus65))
    .attr("opacity", 0.5)
    .on("mouseover", (event, d) => showTooltip(d, year, event, selected))
    .on("mouseout", () => hideTooltip());

  //
  //

  const thresholds = [
    { y: 7, color: col.blue, label: "Aging society(>7%)" },
    { y: 14, color: col.yellow, label: "Aged society(>14%)" },
    { y: 20, color: col.red, label: "Super-aged society(>20%)" },
  ];

  //
  thresholds.forEach((threshold) => {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(threshold.y))
      .attr("y2", y(threshold.y))
      .attr("stroke", threshold.color)
      .attr("stroke-dasharray", "4 2")
      .attr("stroke-width", 2);

    //
    //
    const text = g
      .append("text")
      .attr("x", 10)
      .attr("y", y(threshold.y) - 15)
      .attr("dy", "0.5em")
      .style("font-size", "13px")
      .text(threshold.label);
  });
  /////////////////////////////////////////////////////////////

  //
  const selectedText = d3
    .select("#radiusIndicator")
    .select("option:checked")
    .text();
  if (selected === "default") {
    d3.select("#sub_title").text("Default : Number of Countries");
  } else {
    d3.select("#sub_title").text(`Average by Aging Group: ${selectedText} `);
  }

  //2012
  ["C", "B", "A", "N"].forEach((groupCode) => {
    const htmlClass = groupMap[groupCode];

    const filtered = data.filter((d) => d.group === groupCode);

    let resultText;
    if (selected === "default") {
      resultText = filtered.length.toString();
    } else {
      const valid = filtered.filter((d) => !isNaN(d[selected]));
      const avg = d3.mean(valid, (d) => +d[selected]);
      resultText = avg ? avg.toFixed(2) : "N/A";
    }

    d3.select(`.data_2012_${htmlClass}`).text(resultText);

    //
    d3.select(`.data_2022_${htmlClass}`).style("opacity", 0).text("");
    d3.select(`.change_${htmlClass}`).style("opacity", 0).text("");
  });
} //scatter_65gni

//
//
//
function showTooltip(d, year, event, selected) {
  const selectedLabel = {
    birth: "Crude Birth Rate",
    healthExp: "Private Health Expenditure",
    govHealthExp: "Public Health Expenditure",
    gdp: "GDP per Capita",
    lifeExpectancy: "Life Expectancy",
    oldRatio: "Old-Age Dependency Ratio",
    oopPct: "Out-of-Pocket (%)",
    oopUSD: "Out-of-Pocket (US$)",
    default: null, // default
  };

  const selectedValue = d[selected];
  const formattedValue =
    typeof selectedValue === "number"
      ? selectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "N/A";

  let html = `
    <div style="font-weight:bold; font-size:15px; color:#003366;">
      🔷 ${year} - ${d.country}
    </div>
    <div><strong>Birth Rate:</strong> ${d.birth?.toFixed(1) ?? "N/A"}</div>
    <div><strong>Aged 65+:</strong> ${d.plus65?.toFixed(2) ?? "N/A"}%</div>
    <div><strong>GNI:</strong> $${d.gni?.toLocaleString() ?? "N/A"}</div>
    <div><strong>Life Expectancy:</strong> ${
      d.lifeExpectancy?.toFixed(1) ?? "N/A"
    }</div>
  `;

  // default
  if (selected !== "default" && selectedLabel[selected]) {
    html += `<div><strong>${selectedLabel[selected]}:</strong> ${formattedValue}</div>`;
  }

  tooltips.chart2
    .style("opacity", 1)
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY + "px")
    .html(html);
}

function hideTooltip() {
  tooltips.chart2.transition().duration(300).style("opacity", 0);
}
