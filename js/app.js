(function() {
    queue()
        .defer(d3.json, 'data/sites.json')
        .defer(d3.json, 'data/acs.json')
        .defer(d3.json, 'data/ncs.json')
        .await(ready);

    function ready(error, json0, json1, json2) {
        // prepare datasets and dropdowns
        var sites = reshapeSites(json0);
        var datasets = [reshapeData(json1, sites), reshapeData(json2, sites)];
        populateDropdown('#variable-1', datasets[0].keys(), 'ACS');
        populateDropdown('#variable-2', datasets[1].keys(), 'NCS');
        $('#variable-1').parent().find('.selectize-input').addClass('acs');
        $('#variable-2').parent().find('.selectize-input').addClass('ncs');

        // prepare input and its updating utilities
        var datas, mapIndex, quantizer;
        var getData = function(index) {
            return datasets[index - 1].get(getVariable(index));
        };
        var changeDatas = function() {
            datas = [getData(1), getData(2)];
        };
        var changeMapIndex = function() {
            mapIndex = getMapIndex();
            quantizer = makeQuantizer(datas[mapIndex]);
        };

        // draw
        changeDatas();
        changeMapIndex();
        var barPlots = drawBarPlots('#bar-plots', datas);
        var mapPlot = drawMapPlot('#map-plot', datas[mapIndex], quantizer);
        var scatterPlot = drawScatterPlot('#scatter-plot', datas, mapIndex, quantizer);

        // add event to dropdowns 'variable'
        $('select').on('change', function() {
            if (getVariable($(this).attr('id').split('-')[1]).length !== 0) {
                changeDatas();
                barPlots.change(datas);
                changeMapIndex();
                mapPlot.change(datas[mapIndex], quantizer);
                scatterPlot.change(datas, mapIndex, quantizer);
            }
        });

        // add event to radio buttons 'map-index'
        $('#map-index-selector button').on('click', function() {
            $(this).addClass('active').siblings().removeClass('active');
            changeMapIndex();
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

    function reshapeSites(sites) {
        var rows = d3.map();
        for (var i = 0; i < sites.id.length; ++i) {
            var row = {
                id        : sites.id[i],
                fips      : sites.fips[i],
                name      : sites.name[i],
                shortname : sites.shortname[i],
                roc       : sites.roc[i],
                group     : sites.group[i]
            };
            rows.set(row.id, row);
        }
        return rows;
    }

    function reshapeData(data, sites) {
        var rows = d3.map();
        for (var i = 0; i < data.variable_names.length; ++i) {
            var row = [];
            for (var j = 0; j < data.site_ids.length; ++j) {
                var e = {
                    variable : {
                        name : data.variable_names[i],
                        type : data.variable_types[i]
                    },
                    site : sites.get(data.site_ids[j]),
                    estimate : data.estimates[i][j]
                };
                if ('stderrors' in data) {
                    e['stderror'] = data.stderrors[i][j];
                }
                row.push(e);
            }
            row.sort(function(a, b) { return a.site.id.localeCompare(b.site.id); })
            rows.set(data.variable_names[i], row);
        }
        return rows;
    }

    function populateDropdown(selector, data, name) {
        d3.select(selector).selectAll('option')
            .data(data)
          .enter().append('option')
            .attr('value', function(d) { return d; })
            .text(function(d) { return d; });
        $(selector).selectize({
            placeholder : 'Enter or select ' + name + ' variable'
        });
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
            var s1 = ticks[i],
                s2 = ticks[i + 1];
            var c1 = s1[s1.length - 1],
                c2 = s2[s2.length - 1];
            if ((c1 === '%' || c1 === 'M') && c1 === c2) {
                s1 = s1.slice(0, s1.length - 1);
            }
            return s1 + '-' + s2;
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
