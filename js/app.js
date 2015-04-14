(function() {
    queue()
        .defer(d3.json, 'data/acs.json')
        .defer(d3.json, 'data/ncs.json')
        .await(ready);

    function ready(error, data1, data2) {
        // prepare datasets and dropdowns
        var datasets = [reshape1(data1), reshape2(data2)];
        populateDropdown('#variable-1 + ul', datasets[0].keys());
        populateDropdown('#variable-2 + ul', datasets[1].keys());

        // set default selection for dropdowns
        $('.dropdown-menu').each(function() {
            var s = $(this).find('li a:first').text();
            $(this).parents('.btn-group').find('.selection').text(s);
            $(this).parents('.btn-group').find('.btn').val(s);
        });

        // draw
        var datas = [getData(datasets, 1), getData(datasets, 2)];
        var mapIndex = getMapIndex();
        var quantizer = makeQuantizer(datas[mapIndex]);
        var barPlots = drawBarPlots('#bar-plots', datas);
        var mapPlot = drawMapPlot('#map-plot', datas[mapIndex], quantizer);
        var scatterPlot = drawScatterPlot('#scatter-plot', datas, mapIndex, quantizer);

        // add event to dropdowns 'variable'
        $('.dropdown-menu').on('click', 'li a', function() {
            var s = $(this).text();
            $(this).parents('.btn-group').find('.selection').text(s);
            $(this).parents('.btn-group').find('.btn').val(s);
            datas = [getData(datasets, 1), getData(datasets, 2)];
            barPlots.change(datas);
            mapIndex = getMapIndex();
            quantizer = makeQuantizer(datas[mapIndex]);
            mapPlot.change(datas[mapIndex], quantizer);
            scatterPlot.change(datas, mapIndex, quantizer);
        });

        // add event to radio buttons 'map-index'
        $('#map-index-selector button').on('click', function() {
            $(this).addClass('active').siblings().removeClass('active');
            mapIndex = getMapIndex();
            quantizer = makeQuantizer(datas[mapIndex]);
            mapPlot.change(datas[mapIndex], quantizer);
            scatterPlot.change(datas, mapIndex, quantizer);
        });

        // add event to button 'clear'
        $('#clear').on('click', function(e) {
            e.stopImmediatePropagation();
            $(this).removeClass('active');
            $('.label.active').each(function() {
                deactivate($(this).attr('id').split('-')[1]);
            });
        });

        // add event to buttons 'sort'
        $('.sort').on('click', function() {
            var value = parseInt($(this).val());
            if (value === 0) {
                $('.sort').each(function() { $(this).val(0); });
                $(this).val(1);
            } else {
                $(this).val(-value);
            }
            barPlots.change(datas);
        });

        // add resize event
        $(window).on('resize', function() {
            barPlots.change(datas);
            mapPlot.change(datas[mapIndex], quantizer);
            scatterPlot.change(datas, mapIndex, quantizer);
        });
    }

    function reshape1(data) {
        var rows = d3.map();
        for (var i = 0; i < data.variables.length; ++i) {
            var row = d3.map();
            for (var j = 0; j < data.locations.length; ++j) {
                row.set(data.fips[j], {
                    variable  : data.variables[i],
                    type      : data.types[i],
                    id        : data.fips[j],
                    site      : data.locations[j],
                    sitegroup : data.sitegroups[j],
                    estimate  : data.estimates[i][j],
                    stderror  : data.stderrors[i][j]
                });
            }
            rows.set(data.variables[i], row);
        }
        return rows;
    }

    function reshape2(data) {
        var rows = d3.map();
        for (var i = 0; i < data.variables.length; ++i) {
            var row = d3.map(),
                variable = data.variables[i];
            for (var j = 0; j < data.locations.length; ++j) {
                row.set(data.fips[j], {
                    variable : data.variables[i],
                    type     : 'percentage',
                    id       : data.fips[j],
                    site     : data.locations[j],
                    estimate : data[variable][j]
                });
            }
            rows.set(data.variables[i], row);
        }
        return rows;
    }

    function populateDropdown(selector, data) {
        d3.select(selector).selectAll('a')
            .data(data)
          .enter().append('li').append('a')
            .attr('href', '#')
            .text(function(d) { return d; });
    }

    function getData(datasets, index) {
        return datasets[index - 1].get(getVariable(index)).values();
    }

    function makeQuantizer(data) {
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
        var index = function(d) {
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
        color = function(d) { return colors[index(d)]; };

        return {
            index: index,
            color: color,
            size: function() { return n; },
            getLabelByIndex: function(i) { return labels[i]; },
            getColorByIndex: function(i) { return colors[i]; }
        };
    }
}());
