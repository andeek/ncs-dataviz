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
