function drawBarPlots(selector, datasets) {
    var canvas = d3.select(selector);
    var barPlots = [];

    // draw labels
    var data = getDataVector(1);
    barPlots.push(drawLabels(canvas, null, data, null));

    // draw barplots
    for (var index = 1; index < datasets.length + 1; ++index) {
        var data = getDataVector(index);
        barPlots.push(drawBarPlot(canvas, null, index, data, null));
    }

    // initialize
    change();

    function resizeCanvas(canvas) {
        var width = parseInt(canvas.style('width')),
            height = document.documentElement.clientHeight -
                     parseInt(d3.select('nav').style('height')) -
                     parseInt(d3.select('.controls').style('height'));
        height = height * .95;
        canvas
            .attr('width', width)
            .attr('height', height);
    }

    function computeBbox(canvas, numPlots, index) {
        var margin = { top: 25, left: 20, bottom: 40, right: 20 },
            maxLabelWidth = 150,
            hspaceAfterLabels = 10,
            hspaceAfterBars = 30;

        var width = parseInt(canvas.style('width')),
            height = parseInt(canvas.style('height'));

        if (index === 0) {
            return {
                top: margin.top,
                left: margin.left,
                bottom: height - margin.bottom,
                right: margin.left + maxLabelWidth
            };
        } else {
            var labelsOuterWidth = maxLabelWidth + hspaceAfterLabels,
                barplotsOuterWidth = width - margin.left - margin.right -
                                     labelsOuterWidth,
                barplotOuterWidth = (barplotsOuterWidth + hspaceAfterBars) /
                                    numPlots,
                maxBarWidth = barplotOuterWidth - hspaceAfterBars;
            var left = margin.left + labelsOuterWidth +
                       barplotOuterWidth * (index - 1);
            return {
                top: margin.top,
                left: left,
                bottom: height - margin.bottom,
                right: left + maxBarWidth
            };
        }
    }

    function getDataVector(index) {
        return datasets[index - 1].get(getVariable(index)).values();
    }

    function getOrdered() {
        var sort = getSort().split('-'),
            index = parseInt(sort[0]),
            order = sort[1];
        if (index === 0) {
            var ids = getDataVector(1)
                .sort(function(a, b) { return a.id - b.id; })
                .map(function(d) { return d.id; });
        } else {
            var ids = getDataVector(index)
                .sort(function(a, b) { return a.estimate - b.estimate; })
                .map(function(d) { return d.id; });
        }
        if (order === 'ascending') {
            return ids;
        } else {
            return ids.reverse();
        }
    }

    function change() {
        resizeCanvas(canvas);
        var ordered = getOrdered();
        var index = 0;
        var bbox = computeBbox(canvas, datasets.length, index);
        barPlots[index].change(bbox, ordered);
        for (var index = 1; index < barPlots.length; ++index) {
            var bbox = computeBbox(canvas, datasets.length, index);
            barPlots[index].change(bbox, getDataVector(index), ordered);
        }
    }

    return {
        change: change
    };
}

function makeSortButton (index) {
    var button = d3.select('.sort-controls')
        .append('div')
        .attr('class', 'btn-group btn-group-xs sort-btn-group')
        .append('button')
        .attr('class', 'btn btn-default sort')
        .attr('id', 'sort-' + index)
        .attr('type', 'button');
    return button;
}

function drawLabels(canvas, bbox, data, ordered) {
    var g = canvas.append('g');

    var labels = g.append('g')
        .selectAll('.label')
        .data(data)
      .enter().append('text')
        .attr('class', 'label')
        .attr('id', function(d) { return 'label-' + d.id; })
        .text(function(d) { return d.site; })
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .on('mouseover', function(d) { mouseover(d.id); })
        .on('mouseout', function(d) { mouseout(d.id); })
        .on('click', clicked);

    // make labels invisible before appearing at initialized positions
    labels.attr('transform', 'translate(-200,0)');

    var button = makeSortButton(0);
    button.property('value', '1');

    function updateXY(bbox, ordered) {
        g.attr('transform', 'translate(' + bbox.left + ',' + bbox.top + ')');

        var width = bbox.right - bbox.left,
            height = bbox.bottom - bbox.top;

        var y = makeYScale(ordered, height);

        labels.transition().duration(window.duration)
            .attr('transform', function(d) {
                var j = y(d.id) + y.rangeBand() / 2;
                return 'translate(' + width + ',' + j + ')';
            });

        d3.select(button.node().parentNode)
            .style('left', (bbox.left + width / 2) + 'px');
        button.html(displaySort(button.property('value')));
    }

    return {
        change: updateXY
    };
}

function drawBarPlot(canvas, bbox, index, data, ordered) {
	var g = canvas.append('g');

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(tipHtml);
    g.call(tip);

    var bars = g.append('g')
        .selectAll('.bar')
        .data(data)
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('id', function(d) { return 'bar-' + index + '-' + d.id; })
        .on('mouseover', function(d) {
            tip.show(d);
            mouseover(d.id);
        })
        .on('mouseout', function(d) {
            tip.hide();
            mouseout(d.id);
        })
        .on('click', clicked);

    var xAxisContainer = g.append('g')
        .attr('class', 'x axis');

    var m1se, m2se;
    if ('stderror' in data[0]) {
        m1se = g.append('g')
            .selectAll('.m1se')
            .data(data)
          .enter().append('line')
            .attr('class', 'm1se')
            .attr('id', function(d) { return 'm1se-' + index + '-' + d.id; });
        
        m2se = g.append('g')
            .selectAll('.m2se')
            .data(data)
          .enter().append('line')
            .attr('class', 'm2se')
            .attr('id', function(d) { return 'm2se-' + index + '-' + d.id; });
    }

    var button = makeSortButton(index);
    button.property('value', '0');

    function updateXY(bbox, data, ordered) {
        g.attr('transform', 'translate(' + bbox.left + ',' + bbox.top + ')');

        var width = bbox.right - bbox.left,
            height = bbox.bottom - bbox.top;

        var xMin = data[0].type === 'year' ? getMinValue(data) : 0,
            x = makeXScale([xMin, getMaxValue(data)], width),
            y = makeYScale(ordered, height);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .ticks(Math.min(Math.round(width / 80), 5))
            .tickFormat(getFormatterForAxis(data[0]));

        xAxisContainer.attr('transform', 'translate(0,' + (height - 5) + ')')
            .call(xAxis)
            .selectAll('.tick')
            .append('line')
            .attr('class', 'grid-line')
            .attr('y2', -height);

        bars.data(data)
            .transition().duration(window.duration)
            .attr('x', function(d) { return x.range()[0]; })
            .attr('width', function(d) { return x(d.estimate); })
            .attr('y', function(d) { return y(d.id); })
            .attr('height', y.rangeBand());

        if ('stderror' in data[0]) {
            m1se.data(data)
                .transition().duration(window.duration)
                .attr('x1', function(d) { return x(d.estimate - d.stderror); })
                .attr('x2', function(d) { return x(d.estimate - d.stderror); })
                .attr('y1', function(d) { return y(d.id); })
                .attr('y2', function(d) { return y(d.id) + y.rangeBand(); })
                .attr('display', function(d) {
                    return d.estimate - d.stderror <= x.domain()[0] ?
                           'none' : 'inherit';
                });
            m2se.data(data)
                .transition().duration(window.duration)
                .attr('x1', function(d) { return x(d.estimate - d.stderror * 2); })
                .attr('x2', function(d) { return x(d.estimate - d.stderror * 2); })
                .attr('y1', function(d) { return y(d.id); })
                .attr('y2', function(d) { return y(d.id) + y.rangeBand(); })
                .attr('display', function(d) {
                    return d.estimate - d.stderror * 2 <= x.domain()[0] ?
                           'none' : 'inherit';
                });
        }

        d3.select(button.node().parentNode)
            .style('left', bbox.left + 'px');
        button.html(displaySort(button.property('value')));
    }

    return {
        change: updateXY
    };
}

function makeXScale(domain, width) {
    return d3.scale.linear()
        .domain(domain)
        .range([0, width])
        .nice();
}

function makeYScale(ordered, height) {
    return d3.scale.ordinal()
        .domain(ordered)
        .rangeRoundBands([0, height], .1);
}

function clicked(d) {
    toggleActive(d.id);
}
