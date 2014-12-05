//global variables
var currentYear = 1906;

//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize() {
    setMap();
    setIntroBox();
};

//set choropleth map parameters
function setMap () {

    var mapWidth = 700,
      mapHeight = 700;
    
    var timelineBox = d3.select("body")
            .append("div")
            .attr("class", "timelineBox");
    

    
    var infoPanelBox = d3.select("body")
            .append("div")
            .attr("class", "infoPanelBox");
    
    makeInfoPanel(infoPanelBox);
    
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
        
        
        var yearArray = [];
        
        
        makeTimeline(timelineBox);
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
                    switch (d.properties.Country) {
                            case "Canada":
                                return "yellow";
                                break;
                            case "Russia":
                                return "red";
                                break;
                            case "Norway":
                                return "blue";
                                break;
                            case "Denmark":
                                return "black";
                                return;
                            case "United States":
                                return "green";
                                break;
                            case "Norway, Russia":
                                return "purple";
                                break;
                            case "USSR":
                                return "red";
                                break;
                            default:
                                return "turquois";
                    } //end switch statement
                    
                }
                else { //if not the current year
                    return "none";
                }
             });
    
}; //end update lines


function makeTimeline (timelineBox){
    
    //if we wanted to add in months for this stuff, we could I guess
    //var axisScale = d3.time.scale()
    //        .domain([new Date(1903, 0, 1), new Date(2014, 0, 1)])
    //        .range([0, 875]);
    
    //create a slider using http://bl.ocks.org/mbostock/6452972
    //which is a built-in brush slider for d3
    
    var axisScale = d3.scale.linear()
            .domain([1903, 2014])
            .range([0, 950]);
    
    var axis = d3.svg.axis()
            .scale(axisScale)
            .tickValues([1903,2014])
            .tickFormat(d3.format("d"))
            .orient("bottom");
    
    var timeline = timelineBox.append("svg")
            .attr("width", 980)
            .attr("height", 100)
        .append("g")
            .attr("transform", "translate("+15+", "+20+")")
            .attr("class", "axis")
            .call(axis)
        .selectAll("text")
            .attr("y", 0)   
            .attr("x", 10)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start");
    
    console.log("Yerp");
    
    
}; //end make timeline

function makeInfoPanel (infoPanelBox) {
    console.log("hyup");

}; //end make info panel box

//Creates a box on top of map with short intro
function setIntroBox () {
    p = 1

    var introContainer = d3.select("body")
            .append("div")
            .attr("class", "introContainer")
            .style("z-index", p);

    introContainer.append("text")
        .attr("class", "introTitle")
        .text("A short introduction to ocean claims")
        .append("hr");

    introContainer.append("button")
        .attr("class", "SkipButton")
        .attr("onclick","hide(p)")
        .html("Skip Intro");
        
    }; // end of setIntroBox

function hide(){
        p = -1
        d3.select(".introContainer")
            .style("z-index", p);

    }; // end of hide