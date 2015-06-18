function visualize(error, data) {
    var el = d3.select('.vis');

    //append wrapper div for each variable
    var svg_upper = el.selectAll('div.small-wrapper')
      .data(d3.keys(data))
      .enter().append('div')
      .attr('class', 'small-wrapper')
      .style({
          width: width + margin.right + margin.left + 'px',
          height: height + margin.bottom + margin.top + 'px'
      })
      .append('svg')
      .attr({
          width: width + margin.right + margin.left,
          height: height + margin.bottom + margin.top
      })
      .attr("class", function(d) { return d; });

    //inner group for each plot
    var svg = svg_upper
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //y domain is the same for each plot
    y.domain(data[d3.keys(data)[0]].map(function(d) { return d.name; }));


    //axes
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("y", 6)
        .attr("x", 0)
        .attr("dy", "-.71em")
        .attr("dx", -margin.left + 10 + "px")
        .attr("class", "title")
        .text(function(d) { return d; });

    //setup separate color scales
    var colors = {};
    d3.keys(data).forEach(function(key) {
      colors[key] = d3.scale.category20();
      colors[key].domain(d3.keys(data[key][0]).filter(function(key) { return ["category", "fips", "name", "type"].indexOf(key) == -1; }));

      //gather x values for each bar
      data[key].forEach(function(d) {
        var x0 = 0;
        d.values = colors[key].domain().map(function(name) { return {variable: key, name: name, x0: x0, x1: x0 += +d[name]}; });
        d.values.forEach(function(d) { d.x0 /= x0; d.x1 /= x0; });
      });

    } );

    //create grouped element for bars
    var county = svg.selectAll(".county")
        .data(function(d) { return data[d]; })
      .enter().append("g")
        .attr("class", "county")
        .attr("transform", function(d) { return "translate(0, "+ y(d.name) + ")"; });

    //add rectangles
    county.selectAll("rect")
        .data(function(d) { return d.values; })
      .enter().append("rect")
        .attr("height", y.rangeBand())
        .attr("x", function(d) { return x(d.x0); })
        .attr("width", function(d) { return x(d.x1) - x(d.x0); })
        .style("fill", function(d) { return colors[d.variable](d.name); });


    //sorting function for legends
    var sorted = function(d, i) {

      var variable = d3.select(this.parentNode.parentNode).attr("class");

      // Copy-on-write since tweens are evaluated after a delay.
      var y0 = y.domain(data[variable].sort(
        function(a, b) { return (a.values[i].x1 - a.values[i].x0) - (b.values[i].x1 - b.values[i].x0); })
          .map(function(d) { return d.name; }))
          .copy();

      svg.selectAll(".county")
          .sort(function(a, b) { return y0(b.name) - y0(a.name); });

      var transition = svg.transition().duration(750),
          delay = function(d, i) { return i * 50; };

      transition.selectAll(".county")
          .delay(delay)
          .attr("transform", function(d) { return "translate(0, "+ y0(d.name) + ")"; });

      transition.select(".y.axis")
          .call(yAxis)
        .selectAll("g")
          .delay(delay);
    }


    //add legend
    var legend = svg_upper.selectAll(".legend")
      .data(function(d) { return colors[d].domain().slice(); })
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {return "translate(" + margin.left + "," + (5 - colors[d3.select(this.parentNode.parentNode).data()].domain().slice().length + i) * 20 + ")"; })
        .on("mouseover", function(d, i) {
          d3.select(this).style("cursor", "pointer");
        });


    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d) { return colors[d3.select(this.parentNode.parentNode).data()](d); })
        .on("click", sorted);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; })
        .on("click", sorted);

}
