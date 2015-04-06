window.duration = 250

function getVariable(index) {
    return d3.select('#variable-' + index).property('value');
}

function getSort() {
    var s = '';
    d3.selectAll('.sort').each(function() {
        var index = d3.select(this).attr('id').split('-')[1];
        var value = parseInt(d3.select(this).property('value'));
        if (value === 1) {
            s += index + '-ascending';
        } else if (value === -1) {
            s += index + '-descending';
        }
    });
    return s;
}

function displaySort(value) {
    var s = ['sorted &#x25bc;', 'sort', 'sorted &#x25b2;'];
    return s[parseInt(value) + 1];
}

function getMapIndex() {
    return d3.select('#map-index-selector button.active')
            .attr('id').split('-')[2];
}

function computeCorrelation(x, y) {
    var n = 0,
        sum_x = 0,
        sum_y = 0,
        sum_x2 = 0,
        sum_y2 = 0,
        sum_xy = 0;

    for (var i = 0; i < x.length; ++i) {
        if (x[i] !== null && y[i] !== null) {
            n += 1;
            sum_x += x[i];
            sum_y += y[i];
            sum_x2 += x[i] * x[i];
            sum_y2 += y[i] * y[i];
            sum_xy += x[i] * y[i];
        }
    }

    return (n * sum_xy - sum_x * sum_y) /
           Math.sqrt(n * sum_x2 - sum_x * sum_x) /
           Math.sqrt(n * sum_y2 - sum_y * sum_y);
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFormatterForTip(d) {
    if (d.type === 'percentage') {
        return d3.format('.2%');
    } else if (d.type === 'count') {
        return d3.format('n');
    } else {
        return d3.format('g');
    }
}

function getFormatterForAxis(d) {
    if (d.type === 'percentage') {
        return function(x) {
            var s = (x * 100).toFixed(4).split('.');
            var f = s[1].replace(/0+$/g, '');
            return (f.length === 0 ? s[0] : s[0] + '.' + f) + '%';
        };
    } else if (d.type === 'year') {
        return d3.format('d');
    } else if (d.type === 'count') {
        return d3.format('s');
    } else {
        return d3.format('g');
    }
}

function getMinValue(data) {
    return d3.min(data, function(d) { return d.estimate; });
}

function getMaxValue(data) {
    return d3.max(data, function(d) { return d.estimate; });
}


function makeQuantizer(datasets) {
    var index = getMapIndex();
    var data = datasets[index - 1].get(getVariable(index)).values();

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

function tipHtml(d) {
    var keys = ['variable', 'type', 'id', 'site', 'sitegroup',
                'estimate', 'stderror'],
        displays = ['Variable', 'Data Type', 'FIPS', 'Site', 'Site Group',
                    'Estimate', 'Standard Error'],
        functions = [String, capitalize, String, String, capitalize,
                     getFormatterForTip(d), getFormatterForTip(d)];
    var s = [];
    for (var i = 0; i < keys.length; ++i) {
        if (keys[i] in d) {
            var v = d[keys[i]];
            v = v == null ? 'N.A.' : functions[i](v);
            s.push(displays[i] + ': ' + v);
        }
    }
    return s.join('<br>');
}

function addMouseover(selector) {
    d3.select(selector).classed('mouseover', true);
}

function removeMouseover(selector) {
    d3.select(selector).classed('mouseover', false);
}

function addActive(selector) {
    d3.select(selector).classed('active', true);
}

function removeActive(selector) {
    d3.select(selector).classed('active', false);
}

function mouseover(id) {
    addMouseover('#label-' + id);
    addMouseover('#bar-1-' + id);
    addMouseover('#bar-2-' + id);
    addMouseover('#site-' + id);
    addMouseover('#point-' + id);
}

function mouseout(id) {
    removeMouseover('#label-' + id);
    removeMouseover('#bar-1-' + id);
    removeMouseover('#bar-2-' + id);
    removeMouseover('#site-' + id);
    removeMouseover('#point-' + id);
}

function activate(id) {
    addActive('#label-' + id);
    addActive('#bar-1-' + id);
    addActive('#bar-2-' + id);
    addActive('#site-' + id);
    addActive('#point-' + id);
}

function deactivate(id) {
    removeActive('#label-' + id);
    removeActive('#bar-1-' + id);
    removeActive('#bar-2-' + id);
    removeActive('#site-' + id);
    removeActive('#point-' + id);
}

function toggleActive(id) {
    if (!d3.select('#label-' + id).classed('active')) {
        activate(id);
    } else {
        deactivate(id);
    }
}
