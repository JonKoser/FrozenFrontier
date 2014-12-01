//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize() {
    setMap();
};

//set choropleth map parameters
function setMap () {

  var mapWidth = 960,
      mapHeight = 960;
    
    //create a new svg element with the above dimensions
    var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);


  var projection = d3.geo.orthographic()
      .scale(475)
      .rotate([0, -90, 0])
      .translate([mapWidth / 2, mapHeight / 2])
      .clipAngle(90)
      .precision(.1);
        
    //creat svg path generator using the projection
    var path = d3.geo.path()
            .projection(projection);  
    
    //create graticule generator
    var graticule = d3.geo.graticule()
            .step([10, 10]); //place graticule lines every 5 degrees

    //define a sphere object for the globe map
    map.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    //give the globe a color
    map.append("use")
        .attr("class", "sphereFill")
        .attr("xlink:href", "#sphere");

    //give the globe a stroke
    map.append("use")
        .attr("class", "sphereStroke")
        .attr("xlink:href", "#sphere");

    //append a graticule to the globe
    map.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    
    
    //use queue.js to parallelise asynchronous data loading
    queue()
        .defer(d3.json, "data/landOutline.topojson") //load attributes from csv
        .await(callback); //trigger callback function once data is loaded
   
    //retrieve and process NZ json file and data
    function callback(error, land) {

        var landMasses = map.selectAll(".landMasses") 
                .data(topojson.feature(land, land.objects.landOutline).features)
                .enter() //create elements
                .append("g") //create landMasses group
                .attr("class", "landMasses") //assign class for styling
                .append("path")
                .attr("class", "landBody")
                .attr("d", path); //project data as geometry in svg
        
    };//end callback

}// end setMap

