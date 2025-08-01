//chart3_ex.js

let data_chart3;
let x3, y3;
function createViz3() {
  if (!globalData) {
    console.error("globalData is not loaded yet.");
    return;
  }

  const filtered = globalData.filter(
    (d) =>
      d.IndicatorName === "percent65plus" ||
      d.IndicatorName === "privateHealthExpPerCapita"
  );

  filtered.forEach((d) => {
    d.Year = +d.Year;
    d.Value = +d.Value;
  });

  //
  const nested = d3.group(
    filtered,
    (d) => d.CountryName,
    (d) => d.Year
  );

  const data = [];

  nested.forEach((yearMap, country) => {
    const row2012 = yearMap.get(2012);
    const row2022 = yearMap.get(2022);
    if (row2012 && row2022) {
      const getValue = (arr, name) =>
        (arr.find((d) => d.IndicatorName === name) || {}).Value;

      data.push({
        country,
        exp2012: getValue(row2012, "privateHealthExpPerCapita"),
        plus652012: getValue(row2012, "percent65plus"),
        exp2022: getValue(row2022, "privateHealthExpPerCapita"),
        plus652022: getValue(row2022, "percent65plus"),
      });
    }
  });

  //
  data_chart3 = data.filter(
    (d) =>
      d.exp2012 > 0 &&
      d.exp2022 > 0 &&
      !isNaN(d.plus652012) &&
      !isNaN(d.plus652022) &&
      d.plus652022 <= 30
  );

  scatter_65exp(data_chart3);
}

function scatter_65exp(data) {
  const svg3 = d3.select("#svg3");
  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const width = +svg3.attr("width") - margin.left - margin.right;
  const height = +svg3.attr("height") - margin.top - margin.bottom;

  const svg = svg3
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg3
    .append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("text-anchor", "start")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .text("Over-65 Population(%) vs Private Health Expenditure ($)");

  // y
  svg3
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2 + 18)
    .attr("y", 25)
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .text("Over-65 Population(%)")
    .style("font-size", "18px");

  // x
  svg3
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / +2 + 20)
    .attr("y", height + margin.bottom / 2 + 50)
    .text("Private Health Expenditure ($)")
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .style("font-size", "18px");

  // x
  x3 = d3
    .scaleLog()
    .domain(d3.extent(data.map((d) => d.exp2012).filter((v) => v > 0)))
    .range([0, width])
    .nice();

  const maxY = d3.max(data.map((d) => d.plus652012));
  y3 = d3.scaleLinear().domain([0, 35]).range([height, 0]).nice();

  // x
  const tickVals = [
    2, 4, 6, 8, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000,
  ];
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x3).tickValues(tickVals).tickFormat(d3.format("~s")));

  // y
  svg.append("g").call(d3.axisLeft(y3));

  //
  const thresholds = [
    { y: 7, color: col.blue, label: "Aging society(>7%)" },
    { y: 14, color: col.yellow, label: "Aged society(>14%)" },
    { y: 20, color: col.red, label: "Super-aged society(>20%)" },
  ];
  thresholds.forEach((th) => {
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y3(th.y))
      .attr("y2", y3(th.y))
      .attr("stroke", th.color)
      .attr("stroke-dasharray", "4 2")
      .attr("stroke-width", 2);

    const text = svg
      .append("text")
      .attr("x", 10)
      .attr("y", y3(th.y) - 15)
      .attr("dy", "0.5em")
      .style("font-size", "13px")
      .text(th.label);
    text.raise();
  });

  const tickx = [200, 500, 1000, 2000, 5000];

  tickx.forEach((xVal) => {
    if (xVal > 0) {
      svg
        .append("line")
        .attr("x1", x3(xVal))
        .attr("y1", 0)
        .attr("x2", x3(xVal))
        .attr("y2", height)
        .attr("stroke", "#bbb")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2"); //
    }
  });

  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", y3(35)) //
    .attr("width", width)
    .attr("height", y3(20) - y3(35)) //
    .attr("fill", col.red)
    .attr("opacity", 0.2);

  // (14~20%)
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", y3(20))
    .attr("width", width)
    .attr("height", y3(14) - y3(20))
    .attr("fill", col.yellow)
    .attr("opacity", 0.1);

  //  (7~14%)
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", y3(14))
    .attr("width", width)
    .attr("height", y3(7) - y3(14))
    .attr("fill", col.blue)
    .attr("opacity", 0.2);

  const getColor = (value) => {
    if (value >= 20) return col.red;
    else if (value >= 14) return col.yellow;
    else if (value >= 7) return col.blue;
    else return col.gray;
  };
  //
  //////////////////////////////////////////////
  svg
    .selectAll(".dot2012_exp")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot2012_exp")
    .attr("cx", (d) => x3(d.exp2012))
    .attr("cy", (d) => y3(d.plus652012))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.plus652012))
    .attr("opacity", 0.6)
    .attr("data-country", (d) => d.country)
    .on("mouseover", function (event, d) {
      const info = tooltipData.find(
        (t) => t.country === d.country && t.year === 2012
      );
      if (!info) return;

      tooltips.chart3
        .style("opacity", 1)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + "px").html(`
        <div style="font-weight:bold; font-size:15px; color:#003366;">
         🔷 ${info.year} - ${info.country}
        </div>
        <div> <strong>Birth Rate:</strong> ${
          info.birth?.toFixed(1) ?? "N/A"
        }</div>
        <div> <strong>Aged 65+:</strong> ${
          info.plus65?.toFixed(2) ?? "N/A"
        }%</div>
        <div> <strong>Life Expectancy:</strong> ${
          info.lifeExpectancy?.toFixed(2) ?? "N/A"
        }</div>
        <div> <strong>GNI:</strong> $${
          info.gni?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ??
          "N/A"
        }</div>
        <div> <strong>Health Exp:</strong> $${
          info.healthExp?.toFixed(2) ?? "N/A"
        }</div>
      `);
    })
    .on("mouseout", function () {
      tooltips.chart3.style("opacity", 0);
    });

  //
  const sum2012 = { super: 0, aged: 0, aging: 0, none: 0 };
  const sum2022 = { super: 0, aged: 0, aging: 0, none: 0 };
  const count = { super: 0, aged: 0, aging: 0, none: 0 };

  data.forEach((d) => {
    let cat12, cat22;

    if (d.plus652012 >= 20) cat12 = "super";
    else if (d.plus652012 >= 14) cat12 = "aged";
    else if (d.plus652012 >= 7) cat12 = "aging";
    else cat12 = "none";

    if (d.plus652022 >= 20) cat22 = "super";
    else if (d.plus652022 >= 14) cat22 = "aged";
    else if (d.plus652022 >= 7) cat22 = "aging";
    else cat22 = "none";

    if (!isNaN(d.exp2012)) {
      sum2012[cat12] += d.exp2012;
      count[cat12]++;
    }
    if (!isNaN(d.exp2022)) {
      sum2022[cat22] += d.exp2022;
      count[cat22]++;
    }
  });

  const avg2012 = {};
  const avg2022 = {};
  const categories = ["super", "aged", "aging", "none"];

  categories.forEach((cat) => {
    avg2012[cat] = count[cat] > 0 ? Math.round(sum2012[cat] / count[cat]) : 0;
    avg2022[cat] = count[cat] > 0 ? Math.round(sum2022[cat] / count[cat]) : 0;
  });

  // === table
  const container = d3.select("#container3");

  container
    .selectAll(
      ".data_2022_super, .data_2022_aged, .data_2022_aging, .data_2022_none"
    )
    .style("opacity", 0);

  container
    .selectAll(".change_super, .change_aged, .change_aging, .change_none")
    .style("opacity", 0);

  categories.forEach((cat) => {
    container.select(`.data_2012_${cat}`).text(avg2012[cat]);
    container.select(`.data_2022_${cat} .animated_text2`).text(avg2022[cat]);

    const diff = avg2022[cat] - avg2012[cat];
    const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";

    container
      .select(`.change_${cat} .animated_text2`)
      .text(`${sign}${Math.abs(diff)}`);
  });

  ///////////////////////////
  //
  d3.select("#show2022_v3").on("click", pointMove_chart3);
}

function pointMove_chart3() {
  const thresholds = [
    { y: 7, color: col.blue, label: "Aging society(>7%)" },
    { y: 14, color: col.yellow, label: "Aged society(>14%)" },
    { y: 20, color: col.red, label: "Super-aged society(>20%)" },
  ];

  const getColor = (value) => {
    if (value >= 20) return col.red;
    else if (value >= 14) return col.yellow;
    else if (value >= 7) return col.blue;
    else return col.gray;
  };

  //
  //
  d3.select("#svg3")
    .selectAll(".dot2012_exp")
    .transition()
    .duration(3000)
    .attr("cx", (d) => x3(d.exp2022))
    .attr("cy", (d) => y3(d.plus652022))
    .attr("fill", (d) => colorScale(d.plus652022))
    .attr("opacity", 1);

  //
  d3.select("#svg3")
    .selectAll(".dot2012_exp")
    .on("mouseover", function (event, d) {
      const info = tooltipData.find(
        (t) => t.country === d.country && t.year === 2022
      );
      if (!info) return;

      tooltips.chart3
        .style("opacity", 1)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + "px").html(`
        <div style="font-weight:bold; font-size:15px; color:#003366;">
         🟣 ${info.year} - ${info.country}
        </div>
        <div><strong>Birth Rate:</strong> ${
          info.birth?.toFixed(1) ?? "N/A"
        }</div>
        <div><strong>Aged 65+:</strong> ${
          info.plus65?.toFixed(2) ?? "N/A"
        }%</div>
        <div><strong>Life Expectancy:</strong> ${
          info.lifeExpectancy?.toFixed(2) ?? "N/A"
        }</div>
        <div><strong>GNI:</strong> $${
          info.gni?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ??
          "N/A"
        }</div>
        <div><strong>Health Exp:</strong> $${
          info.healthExp?.toFixed(2) ?? "N/A"
        }</div>
    `);
    })
    .on("mouseout", function () {
      tooltips.chart3.style("opacity", 0);
    });

  //
  d3.select("#table_placeholder3")
    .selectAll(
      ".data_2022_super, .data_2022_aged, .data_2022_aging, .data_2022_none"
    )
    .transition()
    .duration(3000)
    .style("opacity", 1);

  d3.select("#table_placeholder3")
    .selectAll(".change_super, .change_aged, .change_aging, .change_none")
    .transition()
    .duration(3000)
    .style("opacity", 1);
}

////////////////////////////

function resetTo2012_chart3() {
  //
  d3.select("#svg3")
    .selectAll(".dot2012_exp")
    .transition()
    .duration(2000)
    .attr("cx", (d) => x3(d.exp2012))
    .attr("cy", (d) => y3(d.plus652012))
    .attr("fill", (d) => colorScale(d.plus652012))
    .attr("opacity", 0.6);

  //
  d3.select("#svg3")
    .selectAll(".dot2012_exp")
    .on("mouseover", function (event, d) {
      const info = tooltipData.find(
        (t) => t.country === d.country && t.year === 2012
      );
      if (!info) return;

      tooltips.chart3
        .style("opacity", 1)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + "px").html(`
        <div style="font-weight:bold; font-size:15px; color:#003366;">
         🔷 ${info.year} - ${info.country}
        </div>
        <div><strong>Birth Rate:</strong> ${
          info.birth?.toFixed(1) ?? "N/A"
        }</div>
        <div><strong>Aged 65+:</strong> ${
          info.plus65?.toFixed(2) ?? "N/A"
        }%</div>
        <div><strong>Life Expectancy:</strong> ${
          info.lifeExpectancy?.toFixed(2) ?? "N/A"
        }</div>
        <div><strong>GNI:</strong> $${
          info.gni?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ??
          "N/A"
        }</div>
        <div><strong>Health Exp:</strong> $${
          info.healthExp?.toFixed(2) ?? "N/A"
        }</div>
      `);
    })
    .on("mouseout", function () {
      tooltips.chart3.style("opacity", 0);
    });

  //
  d3.select("#table_placeholder3")
    .selectAll(
      ".data_2022_super, .data_2022_aged, .data_2022_aging, .data_2022_none"
    )
    .transition()
    .duration(500)
    .style("opacity", 0);

  d3.select("#table_placeholder3")
    .selectAll(".change_super, .change_aged, .change_aging, .change_none")
    .transition()
    .duration(500)
    .style("opacity", 0);

  d3.select("#table_placeholder3")
    .selectAll(
      ".data_2012_super, .data_2012_aged, .data_2012_aging, .data_2012_none"
    )
    .transition()
    .duration(1000)
    .style("opacity", 1);
}

//////////////////////////////////////////////////////
