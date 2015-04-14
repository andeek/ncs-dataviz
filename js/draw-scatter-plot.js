var drawScatterPlot = (function(selector, datas, index, quantizer) {
    function draw(selector, datas, index, quantizer) {
        var canvas = d3.select(selector);
        var scatterplot = _draw(canvas, datas[0], datas[1]);
        change(datas, index, quantizer);

        function change(datas, index, quantizer) {
            resizeCanvas(canvas);
            var bbox = computeBbox(canvas);
            scatterplot.change(bbox, datas[0], datas[1], index, quantizer);
            updateCorrelation(datas[0], datas[1]);
        }

        return { change: change };
    }

    function _draw(canvas, data1, data2) {
    	var g = canvas.append('g');

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(tipHtml);
        g.call(tip);

        var xAxisContainer = g.append('g')
            .attr('class', 'x axis');

        var yAxisContainer = g.append('g')
            .attr('class', 'y axis');

        var xAxisLabel = xAxisContainer.append('text')
            .attr('class', 'axis-label')
            .attr('y', 35)
            .style('text-anchor', 'middle');

        var yAxisLabel = yAxisContainer.append('text')
            .attr('class', 'axis-label')
            .style('text-anchor', 'middle')
            .attr('dy', '1em');

        var corr = g.append('text')
            .attr('id', 'correlation')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle');

        var points = g.append('g')
            .selectAll('.point')
            .data(data1, getId)
          .enter().append('circle')
            .attr('class', 'point')
            .attr('id', function(d) { return 'point-' + d.id; })
            .attr('r', 5)
            .on('mouseover', function(d) {
                tip.show(d.d);
                mouseover(d.id);
            })
            .on('mouseout', function(d) {
                tip.hide();
                mouseout(d.id);
            })
            .on('click', function (d) { toggleActive(d.id); });

        function changeXY(bbox, data1, data2, index, quantizer) {
            g.attr('transform', 'translate(' + bbox.left + ',' + bbox.top + ')');

            var width = bbox.right - bbox.left,
                height = bbox.bottom - bbox.top;

            var x = makeXScale([getMinValue(data1), getMaxValue(data1)], width),
                y = makeYScale([getMinValue(data2), getMaxValue(data2)], height);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .tickFormat(getFormatterForAxis(data1[0]));
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickFormat(getFormatterForAxis(data2[0]));

            corr.attr('transform',
                      'translate(' + (width / 2) + ',' + (height / 2) + ')');

            xAxisContainer.attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);
            yAxisContainer.call(yAxis);

            xAxisLabel.attr('x', width / 2).text('ACS: ' + data1[0].variable);
            yAxisLabel
                .attr('transform', 'translate(-50,' + (height / 2) + ')rotate(-90)')
                .text('NCS: ' + data2[0].variable);

            var focus = [data1, data2][index];
            var data = d3.range(focus.length).map(function(i) {
                return {
                    id: focus[i].id,
                    d: focus[i],
                    x: data1[i].estimate,
                    y: data2[i].estimate
                };
            });
            points.data(data, getId)
                .transition().duration(window.duration)
                .attr('cx', function(d) { return x(d.x); })
                .attr('cy', function(d) { return y(d.y); })
                .style('fill', function(d) { return quantizer.color(d.d); });

            xAxisLabel.classed('active', false);
            yAxisLabel.classed('active', false);
            [xAxisLabel, yAxisLabel][index].classed('active', true);
        }

        return { change: changeXY };    
    }

    function resizeCanvas(canvas) {
        var width = parseInt(canvas.style('width')),
            height = document.documentElement.clientHeight -
                     parseInt(d3.select('nav').style('height')) -
                     parseInt(d3.select('.controls').style('height'));
        height = height * .95 / 2 - 5;
        canvas.attr('width', width).attr('height', height);
    }

    function computeBbox(canvas) {
        var margin = { top: 20, left: 55, bottom: 40, right: 20 };
        var width = parseInt(canvas.style('width')),
            height = parseInt(canvas.style('height'));
        return {
            top: margin.top,
            left: margin.left,
            bottom: height - margin.bottom,
            right: width - margin.right
        };
    }

    function makeXScale(domain, width) {
        return d3.scale.linear()
            .domain(domain)
            .range([0, width])
            .nice(8);
    }

    function makeYScale(domain, height) {
        return d3.scale.linear()
            .domain(domain)
            .range([height, 0])
            .nice(8);
    }

    function updateCorrelation(data1, data2) {
        var x = data1.slice(0)
            .sort(function(a, b) { return a.id - b.id; })
            .map(function(d) { return d.estimate; });
        var y = data2.slice(0)
            .sort(function(a, b) { return a.id - b.id; })
            .map(function(d) { return d.estimate; });
        var corr = computeCorrelation(x, y);
        d3.select('#correlation').html('&#x3c1; = ' + d3.format('.2f')(corr));
    }

    function getId(d) {
        return d.id;
    }

    return draw;
}());
