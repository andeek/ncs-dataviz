var drawMapPlot = (function(selector, data, quantizer) {
    function draw(selector, data, quantizer) {
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
            g1 = g.append('g'),
            g2 = g.append('g'),
            sites;
        
        var title = canvas.append('text')
            .attr('class', 'map-title')
            .attr('dy', '1em')
            .attr('text-anchor', 'end');

        var legend = canvas.append('g')
            .attr('class', 'legend');

        d3.json('data/states.json', function(error, json) {
            g1.selectAll('state')
                .data(topojson.feature(json, json.objects.states).features)
              .enter().append('path')
                .attr('class', 'state')
                .attr('d', path);
        });

        d3.csv('data/sites.csv', function(d) {
                return { id: d.fips, lon: +d.lon, lat: +d.lat };
            }, function(csv) {
            sites = g2.selectAll('site')
                .data(csv, function(d) { return d.id; })
              .enter().append('circle')
                .attr('class', 'site')
                .attr('cx', function(d) { return projection([d.lon, d.lat])[0]; })
                .attr('cy', function(d) { return projection([d.lon, d.lat])[1]; })
                .attr('r', 5)
                .attr('id', function(d) { return 'site-' + d.id; })
                .on('mouseover', function(d) {
                    tip.show(d);
                    mouseover(d.id);
                })
                .on('mouseout', function(d) {
                    tip.hide();
                    mouseout(d.id);
                })
                .on('click', function(d) {
                    toggleActive(d.id);
                });

            // initialize
            change(data, quantizer);
        });

        function zoomed() {
            g.style('stroke-width', 1.5 / d3.event.scale + 'px');
            g.attr('transform',
                   'translate(' + d3.event.translate + ')' +
                   'scale(' + d3.event.scale + ')');
        }

        function change(data, quantizer) {
            resizeCanvas(canvas);
            sites.data(data, function(d) { return d.id; });

            // apply quantizer to data
            var dataByIndex = d3.range(quantizer.size()).map(function(i) {
                return { index: i, ids: [] };
            });
            data.forEach(function(d) {
                if (d.estimate != null) {
                    dataByIndex[quantizer.index(d)].ids.push(d.id);
                }
                var a = d3.select('#label-' + d.id),
                    b = d3.select('#site-' + d.id);
                if (a.classed('active')) { b.classed('active', true); }
                if (a.classed('mouseover')) { b.classed('mouseover', true); }
                b.transition().duration(window.duration)
                    .style('fill', quantizer.color(d));
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

            items.selectAll('.legend-symbol')
                .transition().duration(window.duration)
                .attr('x', -18)
                .attr('width', 18)
                .attr('height', itemHeight * .95)
                .style('fill', function(d) {
                    return quantizer.getColorByIndex(d.index);
                });

            items.selectAll('.legend-text')
                .transition().duration(window.duration)
                .attr('x', -24)
                .attr('y', itemHeight * .45)
                .text(function(d) {
                    return quantizer.getLabelByIndex(d.index);
                });
        }

        return {
            change: change
        };
    }

    function resizeCanvas(canvas) {
        var width = parseInt(canvas.style('width')),
            height = document.documentElement.clientHeight -
                     parseInt(d3.select('nav').style('height')) -
                     parseInt(d3.select('.controls').style('height'));
        height = height * .95 / 2 - 5;
        canvas.attr('width', width).attr('height', height);
    }

    return draw;
}());
