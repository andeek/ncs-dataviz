(function() {
    queue()
        .defer(d3.json, 'data/acs.json')
        .defer(d3.json, 'data/ncs.json')
        .await(ready);

    function ready(error, data1, data2) {
        // prepare data and dropdowns
        var data1 = reshape1(data1);
        populateDropdown('#variable-1 + ul', data1.keys());
        var data2 = reshape2(data2);
        populateDropdown('#variable-2 + ul', data2.keys());

        // set default selection for dropdowns
        $('.dropdown-menu').each(function() {
            var s = $(this).find('li a:first').text();
            $(this).parents('.btn-group').find('.selection').text(s);
            $(this).parents('.btn-group').find('.btn').val(s);
        });

        // draw
        var barPlots = drawBarPlots('#bar-plots', [data1, data2]);
        var mapPlot = drawMapPlot('#map-plot', [data1, data2]);
        var scatterPlot = drawScatterPlot('#scatter-plot', [data1, data2]);
        scatterPlot.change(mapPlot.change().color);

        // add event to dropdowns 'variable'
        $('.dropdown-menu').on('click', 'li a', function() {
            var s = $(this).text();
            $(this).parents('.btn-group').find('.selection').text(s);
            $(this).parents('.btn-group').find('.btn').val(s);
            barPlots.change();
            // mapPlot.change();
            // scatterPlot.change();
            scatterPlot.change(mapPlot.change().color);
        });

        // add event to radio buttons 'map-index'
        $('#map-index-selector button').on('click', function() {
            $(this).addClass('active').siblings().removeClass('active');
            // mapPlot.change();
            // scatterPlot.change();
            scatterPlot.change(mapPlot.change().color);
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
            barPlots.change();
        });

        // add resize event
        $(window).on('resize', function() {
            barPlots.change();
            // mapPlot.change();
            // scatterPlot.change();
            scatterPlot.change(mapPlot.change().color);
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
})();
