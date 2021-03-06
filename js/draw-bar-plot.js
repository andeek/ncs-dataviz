var drawBarPlots = (function(selector, datas) {
    function drawAll(selector, datas) {
        var canvas = d3.select(selector);
        var plots = [];
        plots.push(drawLabels(canvas, datas[0]));
        for (var i = 0; i < datas.length; ++i) {
            plots.push(drawPlot(canvas, i + 1, datas[i]));
        }
        change(datas);

        function change(datas) {
            resizeCanvas(canvas);
            var ordered = getOrdered(datas);
            var bbox = computeBbox(canvas, datas.length, 0);
            plots[0].change(bbox, ordered);
            for (var i = 0; i < datas.length; ++i) {
                var bbox = computeBbox(canvas, datas.length, i + 1);
                plots[i + 1].change(bbox, datas[i], ordered);
            }
        }

        return { change: change };
    }

    function drawLabels(canvas, data) {
        var g = canvas.append('g');

        var labels = g.append('g')
            .selectAll('.label')
            .data(data, getId)
          .enter().append('text')
            .attr('class', 'label')
            .attr('id', function(d) { return 'label-' + d.site.id; })
            .text(function(d) { return d.site.shortname; })
            .attr('dy', '.35em')
            .attr('text-anchor', 'end')
            .on('mouseover', function(d) { mouseover(d.site.id); })
            .on('mouseout', function(d) { mouseout(d.site.id); })
            .on('click', function(d) { toggleActive(d.site.id); });

        // make labels invisible before appearing at initialized positions
        labels.attr('transform', 'translate(-200,0)');

        var button = makeSortButton(0);
        button.property('value', '1');

        function changeXY(bbox, ordered) {
            g.attr('transform', 'translate(' + bbox.left + ',' + bbox.top + ')');

            var width = bbox.right - bbox.left,
                height = bbox.bottom - bbox.top;

            var y = makeYScale(ordered, height);

            labels.transition().duration(window.duration)
                .attr('transform', function(d) {
                    var j = y(d.site.id) + y.rangeBand() / 2;
                    return 'translate(' + width + ',' + j + ')';
                });

            d3.select(button.node().parentNode)
                .style('left', (bbox.left + width / 2) + 'px');
            button.html(displaySort(button.property('value')));
        }

        return { change: changeXY };
    }

    function drawPlot(canvas, index, data) {
    	var g = canvas.append('g');

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            // .offset([-10, 0])
            .html(tipHtml);
        g.call(tip);

        var nas = g.append('g')
            .selectAll('.na')
            .data(data, getId)
          .enter().append('text')
            .attr('class', 'na')
            .attr('id', function(d) { return 'na-' + index + '-' + d.site.id; })
            .attr('dy', '.35em');

        var bars = g.append('g')
            .selectAll('.bar')
            .data(data, getId)
          .enter().append('rect')
            .attr('class', 'bar')
            .attr('id', function(d) { return 'bar-' + index + '-' + d.site.id; });

        var xAxisContainer = g.append('g')
            .attr('class', 'x axis');

        var m1se, m2se;
        if ('stderror' in data[0]) {
            m1se = g.append('g')
                .selectAll('.m1se')
                .data(data, getId)
              .enter().append('line')
                .attr('class', 'm1se')
                .attr('id', function(d) { return 'm1se-' + index + '-' + d.site.id; });
            
            m2se = g.append('g')
                .selectAll('.m2se')
                .data(data, getId)
              .enter().append('line')
                .attr('class', 'm2se')
                .attr('id', function(d) { return 'm2se-' + index + '-' + d.site.id; });
        }

        var barLayers = g.append('g')
            .selectAll('.bar-layer')
            .data(data, getId)
          .enter().append('rect')
            .attr('class', 'bar-layer')
            .attr('id', function(d) { return 'bar-layer-' + index + '-' + d.site.id; })
            .on('mouseover', function(d) {
                var w1 = parseFloat(d3.select('#bar-' + index + '-' + d.site.id).attr('width')),
                    w2 = parseFloat(d3.select('#bar-layer-' + index + '-' + d.site.id).attr('width'));
                tip.offset([-10, (w1 - w2) / 2]).show(d);
                mouseover(d.site.id);
            })
            .on('mouseout', function(d) {
                tip.hide();
                mouseout(d.site.id);
            })
            .on('click', function(d) { toggleActive(d.site.id); });

        var button = makeSortButton(index);
        button.property('value', '0');

        function changeXY(bbox, data, ordered) {
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

            nas.data(data, getId)
                .transition().duration(window.duration)
                .attr('x', x.range()[0])
                .attr('y', function(d) { return y(d.site.id) + y.rangeBand() / 2; })
                .text(function(d) { return d.estimate == null ? 'N.A.' : ''; });

            barLayers.data(data, getId)
                .transition().duration(window.duration)
                .attr('x', x.range()[0])
                .attr('width', width)
                .attr('y', function(d) { return y(d.site.id); })
                .attr('height', y.rangeBand());

            bars.data(data, getId)
                .transition().duration(window.duration)
                .attr('x', x.range()[0])
                .attr('width', function(d) { return x(d.estimate); })
                .attr('y', function(d) { return y(d.site.id); })
                .attr('height', y.rangeBand());

            if ('stderror' in data[0]) {
                m1se.data(data, getId)
                    .transition().duration(window.duration)
                    .attr('x1', function(d) { return x(d.estimate - d.stderror); })
                    .attr('x2', function(d) { return x(d.estimate - d.stderror); })
                    .attr('y1', function(d) { return y(d.site.id); })
                    .attr('y2', function(d) { return y(d.site.id) + y.rangeBand(); })
                    .attr('display', function(d) {
                        return d.estimate - d.stderror <= x.domain()[0] ?
                               'none' : 'inherit';
                    });
                m2se.data(data, getId)
                    .transition().duration(window.duration)
                    .attr('x1', function(d) { return x(d.estimate - d.stderror * 2); })
                    .attr('x2', function(d) { return x(d.estimate - d.stderror * 2); })
                    .attr('y1', function(d) { return y(d.site.id); })
                    .attr('y2', function(d) { return y(d.site.id) + y.rangeBand(); })
                    .attr('display', function(d) {
                        return d.estimate - d.stderror * 2 <= x.domain()[0] ?
                               'none' : 'inherit';
                    });
            }

            d3.select(button.node().parentNode).style('left', bbox.left + 'px');
            button.html(displaySort(button.property('value')));
        }

        return { change: changeXY };
    }

    function resizeCanvas(canvas) {
        var width = parseInt(canvas.style('width')),
            height = document.documentElement.clientHeight -
                     parseInt(d3.select('nav').style('height')) -
                     parseInt(d3.select('.controls').style('height'));
        height = height * .95;
        canvas.attr('width', width).attr('height', height);
    }

    function computeBbox(canvas, numPlots, index) {
        var margin = { top: 25, left: 20, bottom: 40, right: 20 },
            labelsWidth = 120,
            hspaceAfterLabels = 10,
            hspaceAfterPlot = 30;

        var width = parseInt(canvas.style('width')),
            height = parseInt(canvas.style('height'));

        if (index === 0) {
            return {
                top: margin.top,
                left: margin.left,
                bottom: height - margin.bottom,
                right: margin.left + labelsWidth
            };
        } else {
            var labelsOuterWidth = labelsWidth + hspaceAfterLabels,
                plotsOuterWidth = width - margin.left - margin.right - labelsOuterWidth,
                plotOuterWidth = (plotsOuterWidth + hspaceAfterPlot) / numPlots,
                plotWidth = plotOuterWidth - hspaceAfterPlot;
            var left = margin.left + labelsOuterWidth + plotOuterWidth * (index - 1);
            return {
                top: margin.top,
                left: left,
                bottom: height - margin.bottom,
                right: left + plotWidth
            };
        }
    }

    function getOrdered(datas) {
        var sort = getSort().split('-'),
            index = parseInt(sort[0]),
            order = sort[1];
        if (index === 0) {
            var ids = datas[0].slice(0)
                .sort(function(a, b) {
                    var aa = a.site.shortname.split(', '),
                        bb = b.site.shortname.split(', ');
                    var s = aa[1].localeCompare(bb[1]);
                    if (s === 0) {
                        s = aa[0].localeCompare(bb[0]);
                    }
                    return s;
                })
                .map(function(d) { return d.site.id; });
        } else {
            var ids = datas[index - 1].slice(0)
                .sort(function(a, b) {
                    return a.estimate !== b.estimate ?
                           a.estimate - b.estimate : a.id - b.id;
                })
                .map(function(d) { return d.site.id; });
        }
        return order === 'ascending' ? ids : ids.reverse();
    }

    function makeSortButton (index) {
        return d3.select('.sort-controls')
            .append('div')
            .attr('class', 'btn-group btn-group-xs sort-btn-group')
            .append('button')
            .attr('class', 'btn btn-default sort')
            .attr('id', 'sort-' + index)
            .attr('type', 'button');
    }

    function makeXScale(domain, width) {
        return d3.scale.linear()
            .domain(domain)
            .range([0, width])
            .nice();
    }

    function makeYScale(ids, height) {
        return d3.scale.ordinal()
            .domain(ids)
            .rangeRoundBands([0, height], .1);
    }

    function getId(d) {
        return d.site.id;
    }

    return drawAll;
}());
