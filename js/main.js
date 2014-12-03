//global variables
var currentYear = 1925;

//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize() {
    setMap();
};

//set choropleth map parameters
function setMap () {

    var mapWidth = 600,
      mapHeight = 600;
    
    var infoPanelBox = d3.select("body")
            .append("div")
            .attr("class", "infoPanelBox");
    
    var mapContainer = d3.select("body")
            .append("div")
            .attr("class", "mapContainer");
    
    mapContainer.append("text")
        .attr("class", "displayYear")
        .text(currentYear);
    
    //create a new svg element with the above dimensions
    var map = d3.select(".mapContainer")
            .append("svg")
            .attr("class", "map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);

    var projection = d3.geo.orthographic()
            .scale(500)
            .rotate([0, -90, 0])
            .translate([mapWidth / 2, mapHeight / 2])
            .clipAngle(90)
            .precision(.1);
        
    //creat svg path generator using the projection
    var path = d3.geo.path()
            .projection(projection);  
    
    //create graticule generator
    var graticule = d3.geo.graticule()
            //.step([10, 10]); //place graticule lines every 10 degrees

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
        .defer(d3.json, "data/landOutline.topojson") //load attributes from topojson
        .defer(d3.json, "data/Test_Lines.topojson")
        .await(callback); //trigger callback function once data is loaded
   
    //retrieve and process NZ json file and data
    function callback(error, land, lines) {

        var landMasses = map.selectAll(".landMasses") 
                .data(topojson.feature(land, land.objects.landOutline).features)
                .enter() //create elements
                .append("g") //create landMasses group
                .attr("class", "landMasses") //assign class for styling
                .append("path")
                .attr("class", "landBody")
                .attr("d", path); //project data as geometry in svg 

        
        var lines = map.selectAll(".lines")
                .data(topojson.feature(lines, lines.objects.Test_Lines).features)
                .enter()
                .append("g")
                .attr("class", "lines")
                .append("path")
                .attr("class", function (d) {return d.properties.Year})
                .attr("d", path)
                .on("click", function (d) {
                    console.log(d.properties.Descrip);
                })
                .on("mouseover", function() {console.log("over")});
        
        
        updateLines();
    };//end callback
    
    
};// end setMap

function updateYear() {
    var yearText = d3.select(".displayYear");
    yearText.text(currentYear);
}//end display year

//function to update which lines are being displayed
//the only problem I have with this is that I'm unconfortable
//with the fact that I'm drawing all the features first then
//just making the ones we're not using invisible. I feel like
//there must be a way to just selectively draw the features
//based on the year
function updateLines() {
    var lines = d3.selectAll(".lines")
            .style("stroke", function (d) {
                if (d.properties.Year == currentYear) {
                    if (d.properties.Country == "Canada") {
                        return "blue";
                    }
                    else {return "purple"};
                }
                else {
                    return "none";
                }
             });
    
}; //end update lines

