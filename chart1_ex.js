//chart1_ex.js

let globalData;
let Year_bp;
let birthPath;
let plus65Path;
let lineBirth, linePlus65;
let birthLabel, agedLabel;
let tooltipData = [];
const tooltips = {};

//Load Table
function loadTableHTML(file, containerId) {
  fetch(file)
    .then((response) => response.text())
    .then((html) => {
      document.getElementById(containerId).innerHTML = html;
    });
}

function createTooltip(id) {
  return d3
    .select("body")
    .append("div")
    .attr("class", "tooltip tooltip-" + id)
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("opacity", 0);
}

//function: Tooltip Variables
function prepareTooltipData(data) {
  const indicatorMap = {
    percent65plus: "plus65",
    crudeBirthRate: "birth",
    privateHealthExpPerCapita: "healthExp",
    govtHealthExpPerCapita: "govHealthExp",
    gniPerCapita: "gni",
    gdpPerCapita: "gdp",
    lifeExpectancy: "lifeExpectancy",
    aged_State: "agedState", //
    oldDependencyRatio: "oldRatio",
    oopPctHealthExp: "oopPct",
    oopPerCapitaUSD: "oopUSD",
  };

  const filtered = data.filter((d) =>
    indicatorMap.hasOwnProperty(d.IndicatorName)
  );

  filtered.forEach((d) => {
    d.Year = +d.Year;
    if (d.IndicatorName !== "aged_State") {
      d.Value = +d.Value;
    }
  });

  const grouped = d3
    .rollups(
      filtered,
      (v) => {
        const row = {
          year: v[0].Year,
          country: v[0].CountryName,
        };
        v.forEach((d) => {
          const key = indicatorMap[d.IndicatorName];
          row[key] = d.Value;
        });
        return row;
      },
      (d) => `${d.CountryName}-${d.Year}`
    )
    .map((d) => d[1]);

  tooltipData = grouped;

  tooltips.chart1 = createTooltip(1);
  tooltips.chart2 = createTooltip(2);
  tooltips.chart3 = createTooltip(3);
}

//Create Visualize_1
function createViz1() {
  d3.csv("wdi_aged.csv").then(function (data) {
    globalData = data;
    prepareTooltipData(data);
    line_birth_age(data);

    //Other Charts
    createViz2();
    createViz3();
  });
}
function line_birth_age(data) {
  //
  const filteredData = data.filter(
    (d) =>
      (d.IndicatorName === "crudeBirthRate" ||
        d.IndicatorName === "percent65plus") &&
      d.CountryName === "World"
  );

  filteredData.forEach((d) => {
    d.Year = +d.Year;
    d.Value = +d.Value;
  });
  const grouped = d3.rollup(
    filteredData,
    (v) => {
      const result = { Year: v[0].Year };
      v.forEach((d) => {
        if (d.IndicatorName === "crudeBirthRate") {
          result.birth = d.Value;
        } else if (d.IndicatorName === "percent65plus") {
          result.plus65 = d.Value;
        }
      });
      return result;
    },
    (d) => d.Year
  );

  //Year_bp
  Year_bp = Array.from(grouped.values());

  //
  const svg1 = d3.select("#svg1");
  totalWidth = +svg1.attr("width");
  totalHeight = +svg1.attr("height");
  const margin = { top: 50, right: 50, bottom: 60, left: 60 };
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  //
  const svg = d3
    .select("#svg1")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  //
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(Year_bp, (d) => d.Year)) // [min, max]
    .range([0, width]);

  // y
  const yMax = d3.max(Year_bp, (d) => Math.max(d.birth, d.plus65));
  const yMin = d3.min(Year_bp, (d) => Math.min(d.birth, d.plus65));

  const yScale = d3
    .scaleLinear()
    .domain([0, yMax]) //
    .nice()
    .range([height, 0]); // SVG

  ////////////////////////////////////////
  svg
    .append("text")
    .attr("x", -50) //
    .attr("y", -30) //
    .attr("text-anchor", "start")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("fill", "midnightblue")
    .text("Global Birth Rate & Over-65 Population (%)");

  // /////////////////////////////////////
  //
  // x
  // x
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSize(10)); // ←

  // y
  svg
    .append("g")
    .attr("transform", `translate(0, 0)`)
    .call(d3.axisLeft(yScale).tickSize(10)); // ←

  // y
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`) //
    .attr("x", -height / 2) // y
    .attr("y", -margin.left + 18) //
    .style("font-weight", "bold")
    .style("fill", col.title)
    .text("Percent (%)")
    .style("font-size", "18px");
  //x
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2) // y
    .attr("y", height + margin.bottom / 2 + 18) //
    .text("Year")
    .style("font-weight", "bold")
    .style("fill", col)
    .style("font-size", "18px");

  ////////////////////////////////////////////
  // //
  const initialData = Year_bp.filter((d) => d.Year <= 2012);

  lineBirth = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.birth));
  // console.log(lineBirth);

  linePlus65 = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.plus65));

  // ////////////////////////////////////////////////////
  // "#a6cee3","#b2df8a","#fdbf6f"]
  const thresholds = [
    { y: 7, color: col.blue, label: "Aging society(>7%)" },
    { y: 14, color: col.yellow, label: "Aged society(>14%)" },
    { y: 20, color: col.red, label: "Super-aged society(>20%)" },
  ];

  //
  thresholds.forEach((threshold) => {
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(threshold.y))
      .attr("y2", yScale(threshold.y))
      .attr("stroke", threshold.color)
      .attr("stroke-dasharray", "4 2")
      .attr("stroke-width", 2);

    // 텍스트도 함께 추가
    svg
      .append("text")
      .attr("x", 10)
      .attr("y", yScale(threshold.y) - 22)
      .attr("dy", "0.4em")
      .style("font-size", "13px")
      .text(threshold.label);
  });

  //
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(22)) //
    .attr("width", width)
    .attr("height", yScale(20) - yScale(22)) //
    .attr("fill", col.red)
    .attr("opacity", 0.2);

  //  (14~20%)
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(20))
    .attr("width", width)
    .attr("height", yScale(14) - yScale(20))
    .attr("fill", col.yellow)
    .attr("opacity", 0.1);

  // (7~14%)
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(14))
    .attr("width", width)
    .attr("height", yScale(7) - yScale(14))
    .attr("fill", col.blue)
    .attr("opacity", 0.1);

  //
  birthPath = svg
    .append("path")
    .datum(initialData)
    .attr("fill", "none")
    .attr("stroke", col.yellow)
    .attr("stroke-width", 4)
    .attr("stroke-dasharray", "4 2")
    .attr("d", lineBirth);

  plus65Path = svg
    .append("path")
    .datum(initialData)
    .attr("fill", "none")
    .attr("stroke", col.red)
    .attr("stroke-width", 4)
    .attr("stroke-dasharray", "4 2")
    .attr("d", linePlus65);

  //
  const lastData = initialData[1];

  //  (Birth rate)
  //

  //
  const birthGroup = svg
    .append("g")
    .attr("class", "birth-label-group")
    .style("cursor", "pointer")
    .on("mouseover", function (event) {
      const year = 2022;
      const bottom10 = tooltipData
        .filter((d) => d.year === year && d.birth != null)
        .sort((a, b) => d3.ascending(a.birth, b.birth)) //
        .slice(0, 10);

      const tableRows = bottom10
        .map(
          (d, i) =>
            `<tr><td>${i + 1}</td><td>${d.country}</td><td>${d.birth.toFixed(
              1
            )}</td></tr>`
        )
        .join("");

      const html = `
      <strong>Bottom 10 Countries by Birth Rate (2022)</strong>
      <table style="margin-top:15px">
        <thead><tr><th>#</th><th>Country</th><th>Birth Rate</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

      tooltips.chart1
        .html(html)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 30 + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mouseout", function () {
      tooltips.chart1.transition().duration(200).style("opacity", 0);
    });

  //
  birthLabel = birthGroup
    .append("text")
    .attr("x", width - 150)
    .attr("y", yScale(lastData.birth) + 40)
    .attr("fill", "#333344")
    .attr("font-size", "15px")
    .style("font-weight", "bold")
    .attr("alignment-baseline", "middle")
    .style("opacity", 0)
    .text("Birth Rate");

  //  hover
  birthGroup
    .append("rect")
    .attr("x", width - 160)
    .attr("y", yScale(lastData.birth) + 25)
    .attr("width", 230)
    .attr("height", 30)
    .attr("fill", "transparent");

  // World Over65 Lable, Event(Hover)
  const agedGroup = svg
    .append("g")
    .attr("class", "aged-label-group")
    .style("cursor", "pointer")
    .on("mouseover", function (event) {
      const year = 2022; //
      const top10 = tooltipData
        .filter((d) => d.year === year && d.plus65 != null)
        .sort((a, b) => d3.descending(a.plus65, b.plus65))
        .slice(0, 10);

      const tableRows = top10
        .map(
          (d, i) =>
            `<tr><td>${i + 1}</td><td>${d.country}</td><td>${d.plus65.toFixed(
              1
            )}%</td></tr>`
        )
        .join("");

      const html = `
      <strong>Top 10 Countries by 65+ Population (2022)</strong>
      <table style="margin-top:10px">
        <thead><tr><th>#</th><th>Country</th><th>% Aged 65+</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

      tooltips.chart1
        .html(html)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 30 + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mouseout", function () {
      tooltips.chart1.transition().duration(200).style("opacity", 0);
    });

  //
  agedLabel = agedGroup
    .append("text")
    .attr("x", width - 200)
    .attr("y", yScale(lastData.plus65) - 8)
    .attr("fill", "#333344")
    .attr("font-size", "15px")
    .style("font-weight", "bold")
    .attr("alignment-baseline", "middle")
    .style("opacity", 0)
    .text("Population Over 65");

  //
  agedGroup
    .append("rect")
    .attr("x", width - 210)
    .attr("y", yScale(lastData.plus65) - 20)
    .attr("width", 250)
    .attr("height", 30)
    .attr("fill", "transparent");

  // /////////////////////////////////////////////////////////
  // Click:
  d3.select("#show2022_v1").on("click", drawLineTo2022);

  ///Table기
  // 1.
  const y2012 = Year_bp.find((d) => d.Year === 2012);

  // 2.

  if (y2012) {
    d3.select(".data_2012_birth").text(y2012.birth.toFixed(1)); // ←
    d3.select(".data_2012_plus65").text(y2012.plus65.toFixed(1)); // ←
  }
} //line_birth_age

////Event :drawLine//////////////////////////////////////////////////////

//DrawLine event(Click), Tooltip(Hover)
function drawLineTo2022() {
  const laterData = Year_bp.filter((d) => d.Year > 2011);

  //
  const extraBirthPath = d3
    .select("svg g")
    .append("path")
    .datum(laterData)
    .attr("fill", "none")
    .attr("stroke", col.yellow)
    .attr("stroke-width", 4)
    .attr("d", lineBirth);

  const totalLengthBirth = extraBirthPath.node().getTotalLength();
  extraBirthPath
    .attr("stroke-dasharray", totalLengthBirth + " " + totalLengthBirth)
    .attr("stroke-dashoffset", totalLengthBirth)
    .attr("class", "extra-line birth-2022")
    .transition()
    .duration(3000)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0);

  // 65
  const extraPlus65Path = d3
    .select("svg g")
    .append("path")
    .attr("class", "extra-line plus65-2022")
    .datum(laterData)
    .attr("fill", "none")
    .attr("stroke", col.red)
    .attr("stroke-width", 4)
    .attr("d", linePlus65);

  const totalLengthPlus = extraPlus65Path.node().getTotalLength();
  extraPlus65Path
    .attr("stroke-dasharray", totalLengthPlus + " " + totalLengthPlus)
    .attr("stroke-dashoffset", totalLengthPlus)
    .transition()
    .duration(3000)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0);

  birthLabel.transition().duration(3010).style("opacity", 1);
  agedLabel.transition().duration(3010).style("opacity", 1);

  //
  const getValue = (year, key) => {
    const row = Year_bp.find((d) => d.Year === year);
    return row ? row[key] : null;
  };

  const birth2012 = getValue(2012, "birth");
  const birth2022 = getValue(2022, "birth");
  const plus652012 = getValue(2012, "plus65");
  const plus652022 = getValue(2022, "plus65");

  //
  d3.select(".data_2012_birth").text(birth2012?.toFixed(1));
  d3.select(".data_2022_birth").text(birth2022?.toFixed(1));
  d3.select(".data_2012_plus65").text(plus652012?.toFixed(1));
  d3.select(".data_2022_plus65").text(plus652022?.toFixed(1));

  //
  const diffBirth = birth2022 - birth2012;
  const diffPlus65 = plus652022 - plus652012;

  const formatDiff = (val) => {
    if (val === null || isNaN(val)) return "";
    return (val >= 0 ? "+" : "") + val.toFixed(1);
  };
  // JS
  d3.select(".data_2022_birth .animated_text").text(birth2022?.toFixed(1));
  d3.select(".change_birth .animated_text").text(formatDiff(diffBirth));
  d3.select(".data_2022_plus65 .animated_text").text(plus652022?.toFixed(1));
  d3.select(".change_plus65 .animated_text").text(formatDiff(diffPlus65));

  //
  setTimeout(() => {
    d3.selectAll(".animated_text")
      .style("opacity", 1)
      .style("font-size", "24px");
  }, 2900);

  //event:reset
  d3.select("#reset2022_v1").on("click", resetTo2012_chart1);
}

/////////////////////////////////////////////////////
function resetTo2012_chart1() {
  //
  d3.select("svg g").selectAll(".extra-line").remove();

  //
  birthLabel.transition().duration(300).style("opacity", 0);
  agedLabel.transition().duration(300).style("opacity", 0);

  //
  const y2012 = Year_bp.find((d) => d.Year === 2012);
  if (y2012) {
    d3.select(".data_2022_birth").text("");
    d3.select(".data_2022_plus65").text("");
    d3.select(".change_birth").text("");
    d3.select(".change_plus65").text("");
    d3.select(".data_2012_birth").text(y2012.birth.toFixed(1));
    d3.select(".data_2012_plus65").text(y2012.plus65.toFixed(1));
  }

  //
  d3.selectAll(".animated_text").style("opacity", 0).text("");
}
