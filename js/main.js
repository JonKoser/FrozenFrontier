//global variables
var currentYear = 1903;
var yearList = [];


//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize() {
    setMap();
    setWelcomeScreen();
};

function setWelcomeScreen () {
    var backgroundImage = d3.select("body")
        .style("background-image", "url(http://i.imgur.com/PKscn22.jpg?1)")
        .style("background-size", "100% auto");
       
    var welcomeInfo = d3.select("body")
         .append("div")
         .attr("id","welcomeInfo")
         .text("In the past century advances in human technology coupled with climatic change has made the formidable arctic accessible!");
}

//set choropleth map parameters
function setMap () {

    var mapWidth = 700,
      mapHeight = 700;
    
    var timelineBox = d3.select("body")
            .append("div")
            .attr("class", "timelineBox")
            .style("display","none");
    

    
    var infoPanelBox = d3.select("body")
            .append("div")
            .attr("class", "infoPanelBox")
            .style("display","none");
    
    makeInfoPanel(infoPanelBox);
    
    var mapContainer = d3.select("body")
            .append("div")
            .attr("class", "mapContainer")
            .style("display","none");
    
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
                .attr("class", function (d) { yearList.push(d.properties.Year); //should remove duplicates 
                                             return d.properties.Year})
                .attr("d", path)
                .on("click", function (d) {
                    console.log(d.properties.Descrip);
                })
                .on("mouseover", function() {console.log("over")});
        
        console.log(yearList);
        
        
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
    
    //sets up a scale for a data
    var axisScale = d3.scale.linear()
            .domain([1903, 2014]) //range of years
            .range([0, 950]) //range of usable pixel space
            .clamp(true); //has to be within domain
    
    //set up the brush controler
    var brush = d3.svg.brush()
            .x(axisScale)
            .extent([0, 0])
            .on("brush", brushed) //what happens when it is brushed
            .on("brushend", brushend); //what happens when it's done being brushed
    
    //sets up the axis the timeline will run along
    var axisSpecs = d3.svg.axis()
            .scale(axisScale)
            .tickValues([1903, 1918, 1941, 1956, 1974, 1992, 2010, 2014])
            .tickFormat(d3.format("d"))
            .orient("top");
    
    //creates the timeline
    var timeline = timelineBox.append("svg")
            .attr("width", 980)
            .attr("height", 100)
        .append("g")
            .attr("transform", "translate("+15+", "+25+")")
            .attr("class", "axis")
            .call(axisSpecs)
    
    //creates the slider object
    var slider = timeline.append("g")
            .attr("class", "slider")
            .call(brush);
    //dunno
    slider.selectAll(".extent, .resize")
            .remove();
    
    //gives the slider an icon
    var handle = slider.append("circle")
            .attr("class", "handle")
            .attr("r", 7);
        
    //stuff
    slider.call(brush.event)
            .transition() //gratuitous intro!
            .duration(750)
            .call(brush.extent([70, 70]))
            .call(brush.event);
    
    //the function that happens when it is brushed
    function brushed() {
        var value = brush.extent()[0];
        
        if (d3.event.sourceEvent) { //not a programatic event
            value = axisScale.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }
        
        handle.attr("cx", axisScale(value));
    
    } //end brushed
    
    
    //what happens when it is done being brushed
    function brushend() {
        if (!d3.event.sourceEvent) {
            return; //only transtion after input
        }
        
        var value = brush.extent()[0];
        brush.extent([value, value]);
        
        d3.select(this)
            .transition()
            .duration(0)
            .call(brush.event);
        
        d3.select(this)
            .transition()
            .call(brush.extent(brush.extent().map(function(d) {
                    currentYear = d3.round(d, 0);
            
                    //if the current year is not a year from the list (loop through), 
                    //plus 1 until it is!!!!
                    var found = false; //variable to decide whether or not the year is in the list
                    while (found == false) {
                        //checks to see if the new year is in the usable year list
                        if (($.inArray(currentYear, yearList) == -1)) {
                            currentYear++;
                            //if year gets too high, just sets it to 2014
                            if (currentYear >= 2014) {
                                currentYear = 2014;
                                found = true;
                            }
                        }
                        
                        //if it is found in the list, does nothing and ends the loop
                        else {
                            found = true;
                        }
                    } //end while loop
                    //should put something in here to make it snap
                    //to meaningful values only
                    return currentYear; 
                    })))
            .call(brush.event);
        
        
        //update rest of map
        updateLines();
        updateYear();
    }//end brushend

    
}; //end make timeline

function makeInfoPanel (infoPanelBox) {
    console.log("hyup");

}; //end make info panel box

//button functionality, at this moment only goes from welcome screen to map. Also trying to get transitions to work.
function changeVisibility() {
    d3.select(".timelineBox")
        .transition()
        .duration(1000)
        .style("display","block");
    d3.select(".infoPanelBox")
        .style("display","block");
    d3.select(".mapContainer")
        .style("display","block");
    d3.select("#welcomeInfo")
        .style("display","none");    
}; //end changeVisibility


