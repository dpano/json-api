
var margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
d3.json("https://raw.githubusercontent.com/dpano/json-api/main/response_898_s_1.0.json").then(function (rawData) {

    const data = rawData.pca_cluster_centroids.sort((a, b) => b.size - a.size);
    console.log(data)

    // var c10 = d3.scale.category10();
    var svg = d3.select("#container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const size = data.map(d => d.size)
    const rMax = d3.max(size);
    const rMin = d3.max(size);
    const xArray = data.map(d => d.x);
    const yArray = data.map(d => d.y);
    const xMin = d3.min(xArray);
    const xMax = d3.max(xArray);
    const yMin = d3.min(yArray);
    const yMax = d3.max(yArray);
    var color = d3.scaleSequential().domain([0, 6])
        .interpolator(d3.interpolateCool);
    var scale = {
        x: d3.scaleLinear()
            .domain([xMin, xMax])
            .range([0, width]),
        y: d3.scaleLinear()
            .domain([yMin, yMax])
            .range([0, height]),
        radius: d3.scaleLinear()
            .domain([0, rMax])
            .range([0, 80])
    }

    // transformScales(data, scale);   
    console.log('--TRANSFORM--')
    var nodes = svg.selectAll("node")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("cx", function (d) {
            return scale.x(d.x)
        })
        .attr("cy", function (d) {
            return scale.y(d.y)
        })
        .attr("r", (d) => {
            return scale.radius(d.size)
        })
        .style("opacity", .7)
        .attr("fill", function (d, i) {
            return color(d.cluster)
        })
        .on("click", (d) => console.log(d, { x: scale.x(d.x), y: scale.y(d.y), r: scale.radius(d.size) }))

    /**
    *  LEGENDS
    *
    */
    const legendWidth = 400;
    const legendHeight = 300;
    const legendsRadius = 6;
    // select the svg area
    var legend = d3.select("#legend")
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const lg = legend.selectAll('legends')
        .data(data)
        .enter();
    lg.append("circle")
        .attr("class", "legends")
        .attr("cx", function (d) {
            return legendsRadius;
        })
        .attr("cy", (d, idx) => {
            return 5 + idx * 20
        })
        .attr("r", (d) => {
            return legendsRadius
        })
        .attr("fill", function (d, i) {
            return color(d.cluster)
        }).style("opacity", .7);
    lg.append("text")
        .attr("x", 15)
        .attr("y", (d, idx) => 6 + idx * 20)
        .text((d) => d.cluster + '')
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");

    var force = d3.layout.force()
        .nodes(data)
        .size([width, height])
        .gravity(.02)
        .charge(0)
        .on("tick", tick)
        .start();

    force.alpha(.05);

    function tick(e) {
        //force.alpha(.01);

        nodes
            .each(gravity(.2 * e.alpha))
            .each(collide(.5))
            .attr("cx", function (d) { console.log(d); return d.x; })
            .attr("cy", function (d) { return d.y; });
    }

    // Resolve collisions between nodes.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function (d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + padding;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }

    //	Move nodes toward cluster focus.
    function gravity(alpha) {
        return function (d) {
            d.y += (d.cy - d.y) * alpha;
            d.x += (d.cx - d.x) * alpha;
        };
    }
});



function transformScales(data, scale) {
    let _data = data.map(d => {
        return { x: scale.x(d.x), y: scale.y(d.y), size: scale.radius(d.size) }
    });
    console.log(_data);
    delta = []
    _data.forEach(d => {
        if (d.x - d.size < 0) {
            delta.push(Math.abs(d.x - d.size))
        }
        if (d.x + d.size - width > 0) {
            delta.push(d.x + d.size - width)
        }
        if (d.y - d.size < 0) {
            delta.push(Math.abs(d.y - d.size))
        }
        if (d.y + d.size - height > 0) {
            delta.push(d.y + d.size - height);
        }

    });
    let biggestDiff = d3.max(delta);
    console.log('diffs:', d3.max(delta));
    let factor = (width * biggestDiff) / 100;
    console.log()
    return _data
}