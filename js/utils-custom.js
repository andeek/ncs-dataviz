window.duration = 250

function getVariable(index) {
    return d3.select('#variable-' + index).property('value');
}

function getMapIndex() {
    var index = d3.select('#map-index-selector button.active')
        .attr('id').split('-')[2];
    return parseInt(index) - 1;
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

function getFormatterForTip(d) {
    if (d.variable.type === 'Percentage') {
        return d3.format('.2%');
    } else if (d.variable.type === 'Count') {
        return d3.format('n');
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

function getFormatterForAxis(d) {
    if (d.variable.type === 'Percentage') {
        return function(x) {
            var s = (x * 100).toFixed(4).split('.');
            var f = s[1].replace(/0+$/g, '');
            return (f.length === 0 ? s[0] : s[0] + '.' + f) + '%';
        };
    } else if (d.variable.type === 'Year') {
        return d3.format('d');
    } else if (d.variable.type === 'Count') {
        return d3.format('s');
    } else {
        return d3.format('g');
    }
}

function tipHtml(d) {
    var keys = ['Variable', 'Variable Type',
                'Site', 'Site FIPS', 'Site ROC', 'Site Group'],
        values = [d.variable.name, d.variable.type,
                  d.site.name, d.site.fips, d.site.roc, d.site.group];
    var s = [];
    for (var i = 0; i < keys.length; ++i) {
        var k = keys[i];
        var v = values[i] == null ? 'N.A.' : values[i];
        s.push(k + ': ' + v);
    }
    var formatter = getFormatterForTip(d);
    s.push('Value: ' +
           (d.estimate == null ? 'N.A.' : formatter(d.estimate)));
    if ('stderror' in d) {
        s.push('Standard Error: ' +
               (d.stderror == null ? 'N.A.' : formatter(d.stderror)));
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
    addMouseover('#na-1-' + id);
    addMouseover('#bar-2-' + id);
    addMouseover('#na-2-' + id);
    addMouseover('#site-' + id);
    addMouseover('#point-' + id);
}

function mouseout(id) {
    removeMouseover('#label-' + id);
    removeMouseover('#bar-1-' + id);
    removeMouseover('#na-1-' + id);
    removeMouseover('#bar-2-' + id);
    removeMouseover('#na-2-' + id);
    removeMouseover('#site-' + id);
    removeMouseover('#point-' + id);
}

function activate(id) {
    addActive('#label-' + id);
    addActive('#bar-1-' + id);
    addActive('#na-1-' + id);
    addActive('#bar-2-' + id);
    addActive('#na-2-' + id);
    addActive('#site-' + id);
    addActive('#point-' + id);
}

function deactivate(id) {
    removeActive('#label-' + id);
    removeActive('#bar-1-' + id);
    removeActive('#na-1-' + id);
    removeActive('#bar-2-' + id);
    removeActive('#na-2-' + id);
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
