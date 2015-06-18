var margin = {top: 95, right: 10, bottom: 25, left: 75},
    width = 310 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var y = d3.scale.ordinal()
    .rangeRoundBands([height, 0], .1);

var x = d3.scale.linear()
    .rangeRound([0, width])
    .domain([0, 1]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(5)
    .tickFormat(d3.format(".0%"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
