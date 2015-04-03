function drawMapPlot(selector, datasets) {
    var canvas = d3.select(selector);
    resizeCanvas(canvas);

    var width = parseInt(canvas.style('width')),
        height = parseInt(canvas.style('height'));

    var projection = d3.geo.albersUsa()
        .scale(700)
        .translate([width * .45, height * .5]);

    var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([0.8, 16])
        .on('zoom', zoomed);

    var path = d3.geo.path()
        .projection(projection);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(tipHtml);
    canvas.call(tip);

    canvas.call(zoom);

    var g = canvas.append('g'),
        states = g.append('g'),
        sites = g.append('g');
    
    var title = canvas.append('text')
        .attr('class', 'map-title')
        .attr('dy', '1em')
        .attr('text-anchor', 'end');

    var legend = canvas.append('g')
        .attr('class', 'legend');

    d3.json('data/states.json', function(error, json) {
        states.selectAll('state')
            .data(topojson.feature(json, json.objects.states).features)
          .enter().append('path')
            .attr('class', 'state')
            .attr('d', path);
    });

    d3.csv('data/sites.csv', function(csv) {
        sites.selectAll('site')
            .data(csv)
          .enter().append('circle')
            .attr('class', 'site')
            .attr('cx', function(d) { return projection([+d.lon, +d.lat])[0]; })
            .attr('cy', function(d) { return projection([+d.lon, +d.lat])[1]; })
            .attr('r', 5)
            .attr('id', function(d) { return 'site-' + d.fips; })
            .on('mouseover', function(d) {
                tip.show(getDataDict().get(d.fips));
                mouseover(d.fips);
            })
            .on('mouseout', function(d) {
                tip.hide();
                mouseout(d.fips);
            })
            .on('click', function(d) {
                toggleActive(d.fips);
            });

        // initialize
        change();
    });

    function resizeCanvas(canvas) {
        var width = parseInt(canvas.style('width')),
            height = document.documentElement.clientHeight -
                     parseInt(d3.select('nav').style('height')) -
                     parseInt(d3.select('.controls').style('height'));
        height = height * .95 / 2 - 5;
        canvas
            .attr('width', width)
            .attr('height', height);
    }

    function getDataDict() {
        var index = getMapIndex();
        return datasets[index - 1].get(getVariable(index));
    }

    function zoomed() {
        g.style('stroke-width', 1.5 / d3.event.scale + 'px');
        g.attr('transform',
               'translate(' + d3.event.translate + ')' +
               'scale(' + d3.event.scale + ')');
    }

    function change() {
        resizeCanvas(canvas);
        var data = getDataDict().values();

        // map values to n intervals.
        // all intervals are left-closed, except that the last one is closed.
        var interval = d3.scale.linear()
            .domain([getMinValue(data), getMaxValue(data)])
            .nice(8);
        var n = interval.ticks().length - 1;
        interval.range([0, n]);

        // make interval labels
        var ticks = interval.ticks().map(getFormatterForAxis(data[0]));
        var labels = d3.range(n).map(function(i) {
            return ticks[i] + '-' + ticks[i + 1];
        });

        // map data to (n + 1) indices.
        // null values are assigned to the last index.
        var getIndex = function(d) {
            if (d.estimate == null) {
                return n;
            } else {
                var i = Math.floor(interval(d.estimate));
                return i !== n ? i : (n - 1);
            }
        };

        // map data to (n + 1) colors.
        // the last color, which is for null values, is transparent.
        var color = d3.scale.linear()
            .domain(d3.extent(d3.range(n)))
            .range(['rgb(247,251,255)', 'rgb(8,48,107)'])
            .interpolate(d3.interpolateHsl);
        var colors = d3.range(n).map(color);
        colors.push('transparent');
        var getColor = function(d) { return colors[getIndex(d)]; };

        // apply to data
        var dataByIndex = d3.range(n).map(function(i) {
            return { index: i, ids: [] };
        });
        data.forEach(function(d) {
            if (d.estimate != null) { dataByIndex[getIndex(d)].ids.push(d.id); }
            var a = d3.select('#label-' + d.id),
                b = d3.select('#site-' + d.id);
            if (a.classed('active')) { b.classed('active', true); }
            if (a.classed('mouseover')) { b.classed('mouseover', true); }
            b.transition().duration(window.duration)
                .style('fill', getColor(d));
        });

        // legend data join
        var items = legend.selectAll('.legend-item')
            .data(dataByIndex, function(d) { return d.index; });

        var itemsExit = items.exit().remove();

        var itemsEnter = items.enter().append('g')
            .attr('class', 'legend-item')
            .on('mouseover', function(d) {
                d3.selectAll(this.childNodes).classed('mouseover', true);
                d.ids.forEach(function(id) { mouseover(id); });
            })
            .on('mouseout', function(d) {
                d3.selectAll(this.childNodes).classed('mouseover', false);
                d.ids.forEach(function(id) { mouseout(id); });
            })
            .on('click', function(d) {
                d.ids.forEach(function(id) { toggleActive(id); });
            });
        itemsEnter.append('rect')
            .attr('class', 'legend-symbol');
        itemsEnter.append('text')
            .attr('class', 'legend-text')
            .attr('dy', '.35em')
            .style('text-anchor', 'end');

        // redraw
        var width = parseInt(canvas.style('width')),
            height = parseInt(canvas.style('height'));
        var margin = 10;

        // title
        var position = {
            top: margin,
            right: width - margin
        };
        title.transition().duration(window.duration)
            .text(data[0].variable)
            .attr('transform',
                  'translate(' + position.right + ',' + position.top + ')');

        // legend
        var position = {
            top: 40,
            right: width - margin
        };
        legend.transition().duration(window.duration)
            .attr('transform',
                  'translate(' + position.right + ',' + position.top + ')');
        var itemHeight = (height - position.top - margin) / items.size();

        items.attr('transform', function(d) {
            return 'translate(0,' + (itemHeight * d.index) + ')';
        });

        items.selectAll('.legend-symbol').transition().duration(window.duration)
            .attr('x', -18)
            .attr('width', 18)
            .attr('height', itemHeight * .95)
            .style('fill', function(d) { return colors[d.index]; });

        items.selectAll('.legend-text').transition().duration(window.duration)
            .attr('x', -24)
            .attr('y', itemHeight * .45)
            .text(function(d) { return labels[d.index]; });

        return {
            color: getColor
        };
    }

    return {
        change: change
    };
}
