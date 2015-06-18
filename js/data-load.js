(function() {
  queue()
      .defer(d3.json, 'data/ncs_long.json')
      .await(visualize);
}());
